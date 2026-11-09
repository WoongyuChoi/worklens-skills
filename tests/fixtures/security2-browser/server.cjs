"use strict";

const http = require("node:http");
const { createHash, randomUUID } = require("node:crypto");

function cookieValue(header, name) {
  for (const entry of (header || "").split(";")) {
    const at = entry.indexOf("=");
    if (at >= 0 && entry.slice(0, at).trim() === name) return entry.slice(at + 1).trim();
  }
  return null;
}

function applyCors(request, response) {
  response.setHeader("Vary", "Accept-Encoding, Origin");
  if (request.headers.origin) {
    response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function page(response, title) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`<!doctype html><html lang="ko"><meta charset="utf-8"><title>${title}</title><h1>${title}</h1><p>합성 업무용 페이지입니다.</p></html>`);
}

async function readText(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024) throw new Error("body-limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function textFrame(value) {
  const body = Buffer.from(value, "utf8");
  if (body.length >= 126) throw new Error("frame-limit");
  return Buffer.concat([Buffer.from([0x81, body.length]), body]);
}

async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function createFixture({ servicePort = 0, workbenchPort = 0 } = {}) {
  const sessions = new Map();
  const observations = [];
  const sockets = new Set();
  const state = { enabled: false, marker: "CANARY-NOTICE-2026" };
  const authenticated = request => sessions.has(cookieValue(request.headers.cookie, "wl_origin_session"));

  const service = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      observations.push({ channel: "http", method: request.method, path: pathname, origin: request.headers.origin || null });
      applyCors(request, response);
      if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }
      if (pathname === "/" && request.method === "GET") { page(response, "알림 설정"); return; }
      if (pathname === "/session" && request.method === "POST") {
        await readText(request);
        const id = randomUUID();
        sessions.set(id, { user: "synthetic-user" });
        response.setHeader("Set-Cookie", `wl_origin_session=${id}; Path=/; HttpOnly; SameSite=Lax`);
        json(response, 200, { ready: true });
        return;
      }
      if (pathname === "/api/preferences") {
        if (!authenticated(request)) { json(response, 401, { error: "세션이 필요합니다." }); return; }
        if (request.method === "GET") { json(response, 200, { ...state }); return; }
        if (request.method === "POST") {
          const contentType = (request.headers["content-type"] || "").split(";")[0].trim();
          if (contentType !== "text/plain" && contentType !== "application/x-www-form-urlencoded") {
            json(response, 415, { error: "지원하지 않는 입력 형식입니다." }); return;
          }
          const enabled = new URLSearchParams(await readText(request)).get("enabled");
          if (enabled !== "on" && enabled !== "off") { json(response, 422, { error: "설정값이 올바르지 않습니다." }); return; }
          state.enabled = enabled === "on";
          json(response, 200, { ...state });
          return;
        }
      }
      json(response, 404, { error: "경로가 없습니다." });
    } catch {
      if (!response.headersSent) json(response, 400, { error: "요청을 처리하지 못했습니다." });
      else response.end();
    }
  });

  service.on("upgrade", (request, socket) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const key = request.headers["sec-websocket-key"];
    const accepted = pathname === "/events" && authenticated(request)
      && request.headers["sec-websocket-version"] === "13"
      && typeof key === "string" && Buffer.from(key, "base64").length === 16;
    observations.push({ channel: "websocket", path: pathname, origin: request.headers.origin || null, accepted });
    if (!accepted) { socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n"); return; }
    sockets.add(socket);
    socket.on("error", () => socket.destroy());
    socket.on("close", () => sockets.delete(socket));
    const accept = createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n");
    socket.end(Buffer.concat([textFrame(state.marker), Buffer.from([0x88, 0x00])]));
  });

  const workbench = http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/") page(response, "별도 업무 작업 공간");
    else { response.writeHead(404); response.end(); }
  });
  const serviceOrigin = await listen(service, servicePort);
  let workbenchOrigin;
  try { workbenchOrigin = await listen(workbench, workbenchPort); }
  catch (error) { service.close(); service.closeAllConnections?.(); throw error; }
  return {
    service, workbench, serviceOrigin, workbenchOrigin, state, observations,
    async close() {
      for (const socket of sockets) socket.destroy();
      await Promise.all([service, workbench].map(server => new Promise(resolve => {
        server.close(resolve);
        server.closeAllConnections?.();
      })));
    }
  };
}

if (require.main === module) {
  createFixture().then(fixture => {
    console.log(`알림 서비스: ${fixture.serviceOrigin}`);
    console.log(`별도 작업 공간: ${fixture.workbenchOrigin}`);
    process.once("SIGINT", () => fixture.close());
    process.once("SIGTERM", () => fixture.close());
  }).catch(error => { console.error("시작 실패:", error.code || error.message); process.exitCode = 1; });
}

module.exports = { createFixture, applyCors, cookieValue };
