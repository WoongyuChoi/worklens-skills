'use strict';

const http = require('node:http');
const config = require('./deployment.cjs');

function json(response, status, value) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': body.length,
    'cache-control': 'no-store'
  });
  response.end(body);
}

function requestUrl(request) {
  return new URL(request.url, 'http://local.invalid');
}

function isManagement(pathname) {
  return pathname === config.managementBasePath ||
    pathname.startsWith(config.managementBasePath + '/');
}

function backend(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: '허용하지 않는 메서드' });
  let url;
  try { url = requestUrl(request); } catch { return json(response, 400, { error: '잘못된 경로' }); }
  if (url.pathname === '/health') return json(response, 200, { status: 'UP' });
  if (url.pathname === '/api/catalog') {
    return json(response, 200, { items: [{ id: '000000012345678901', name: '합성 상품', available: true }] });
  }
  if (url.pathname === config.managementBasePath + '/runtime') {
    return json(response, 200, {
      kind: '운영 설정', syntheticMarker: 'OPS-RUNTIME-DEMO',
      service: config.serviceName, stage: config.stage, routeGroups: ['catalog', 'management']
    });
  }
  if (url.pathname === config.managementBasePath + '/queues') {
    return json(response, 200, {
      kind: '운영 대기열', syntheticMarker: 'OPS-QUEUE-DEMO',
      queues: [{ name: 'preview-rebuild', waiting: 0 }]
    });
  }
  return json(response, 404, { error: '경로 없음' });
}

function edge(upstreamPort) {
  return (request, response) => {
    if (request.method !== 'GET') return json(response, 405, { error: '허용하지 않는 메서드' });
    let url;
    try { url = requestUrl(request); } catch { return json(response, 400, { error: '잘못된 경로' }); }
    if (isManagement(url.pathname)) return json(response, 403, { error: '운영 경로는 운영 입구에서 이용하세요' });
    let upstreamPath;
    if (url.pathname === '/health') {
      upstreamPath = '/health';
    } else if (url.pathname.startsWith(config.publicBasePath + '/')) {
      upstreamPath = url.pathname.slice(config.publicBasePath.length);
    } else {
      return json(response, 404, { error: '경로 없음' });
    }
    const upstream = http.request({
      hostname: config.bindAddress, port: upstreamPort, method: 'GET',
      path: upstreamPath + url.search,
      headers: { accept: 'application/json', 'x-preview-hop': 'edge' }, agent: false
    }, incoming => {
      const chunks = [];
      let bytes = 0;
      incoming.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > config.maxResponseBytes) {
          incoming.destroy();
          if (!response.writableEnded) json(response, 502, { error: '응답 크기 초과' });
          return;
        }
        chunks.push(chunk);
      });
      incoming.on('end', () => {
        if (response.writableEnded) return;
        const body = Buffer.concat(chunks);
        response.writeHead(incoming.statusCode, {
          'content-type': 'application/json; charset=utf-8',
          'content-length': body.length, 'cache-control': 'no-store'
        });
        response.end(body);
      });
      incoming.on('error', () => {
        if (!response.writableEnded) json(response, 502, { error: '운영 연결 오류' });
      });
    });
    upstream.setTimeout(config.upstreamTimeoutMs, () => upstream.destroy(new Error('timeout')));
    upstream.on('error', () => {
      if (!response.writableEnded) json(response, 502, { error: '운영 연결 오류' });
    });
    upstream.end();
  };
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, config.bindAddress, () => {
      server.removeListener('error', reject);
      resolve(server.address().port);
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
}

async function start() {
  const upstream = http.createServer(backend);
  const upstreamPort = await listen(upstream);
  const gateway = http.createServer(edge(upstreamPort));
  let gatewayPort;
  try { gatewayPort = await listen(gateway); }
  catch (error) { await closeServer(upstream); throw error; }
  let closed = false;
  return {
    publicOrigin: `http://${config.bindAddress}:${gatewayPort}`,
    operationsOrigin: `http://${config.bindAddress}:${upstreamPort}`,
    async close() {
      if (closed) return;
      closed = true;
      await Promise.all([closeServer(gateway), closeServer(upstream)]);
    }
  };
}

module.exports = { start };

if (require.main === module) {
  start().then(instance => {
    process.stdout.write(JSON.stringify({
      publicOrigin: instance.publicOrigin, operationsOrigin: instance.operationsOrigin,
      note: '숫자 루프백에만 연결되는 합성 서비스입니다.'
    }) + '\n');
    const stop = async () => {
      try { await instance.close(); } catch { process.exitCode = 1; }
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }).catch(() => {
    process.stderr.write('합성 서비스를 시작하지 못했습니다.\n');
    process.exitCode = 1;
  });
}
