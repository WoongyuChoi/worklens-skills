'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { start } = require('./fixtures/security2-deployment/server.cjs');

function get(origin, path) {
  return new Promise((resolve, reject) => {
    const request = http.get(new URL(path, origin), { agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try { resolve({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (error) { reject(error); }
      });
      response.on('error', reject);
    });
    request.setTimeout(2000, () => request.destroy(new Error('fixture timeout')));
    request.on('error', reject);
  });
}

test('deployment fixture preserves local service and operator controls', async () => {
  const instance = await start();
  try {
    assert.equal(new URL(instance.publicOrigin).hostname, '127.0.0.1');
    assert.equal(new URL(instance.operationsOrigin).hostname, '127.0.0.1');
    assert.notEqual(instance.publicOrigin, instance.operationsOrigin);
    const health = await get(instance.publicOrigin, '/health');
    assert.equal(health.status, 200);
    assert.deepEqual(health.body, { status: 'UP' });
    const catalog = await get(instance.publicOrigin, '/service/api/catalog');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.body.items[0].id, '000000012345678901');
    const operator = await get(instance.operationsOrigin, '/internal/manage/runtime');
    assert.equal(operator.status, 200);
    assert.equal(operator.body.syntheticMarker, 'OPS-RUNTIME-DEMO');
    const queues = await get(instance.operationsOrigin, '/internal/manage/queues');
    assert.equal(queues.status, 200);
    assert.equal(queues.body.syntheticMarker, 'OPS-QUEUE-DEMO');
    const unregistered = await get(instance.publicOrigin, '/missing');
    assert.equal(unregistered.status, 404);
  } finally {
    await instance.close();
    await instance.close();
  }
});
