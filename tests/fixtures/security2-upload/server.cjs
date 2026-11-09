"use strict";

const http = require("node:http");
const { AttachmentStore } = require("./attachments.cjs");

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 48 * 1024) throw new Error("body-limit");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function createServer(store = new AttachmentStore()) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      if (pathname === "/api/uploads" && request.method === "POST") {
        const { files } = await readJson(request);
        const result = store.submit(files);
        sendJson(response, result.status, result.body);
        return;
      }
      if (pathname === "/api/uploads" && request.method === "GET") {
        sendJson(response, 200, { items: store.list() });
        return;
      }
      const match = pathname.match(/^\/api\/uploads\/([a-f0-9-]+)(?:\/(review|download))?$/);
      if (match && match[2] === "review" && request.method === "POST") {
        const { decision } = await readJson(request);
        const result = store.review(match[1], decision);
        sendJson(response, result.status, result.body);
        return;
      }
      if (match && match[2] === "download" && request.method === "GET") {
        const record = store.download(match[1]);
        if (!record) { sendJson(response, 404, { error: "다운로드할 첨부파일이 없습니다." }); return; }
        response.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment; filename=attachment.txt",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store"
        });
        response.end(record.text);
        return;
      }
      if (match && !match[2] && request.method === "DELETE") {
        sendJson(response, store.remove(match[1]) ? 200 : 404, { removed: true });
        return;
      }
      sendJson(response, 404, { error: "경로가 없습니다." });
    } catch {
      if (!response.headersSent) sendJson(response, 400, { error: "요청을 처리하지 못했습니다." });
      else response.end();
    }
  });
  return { server, store };
}

if (require.main === module) {
  const { server } = createServer();
  server.listen(0, "127.0.0.1", () => {
    console.log(`첨부파일 서비스: http://127.0.0.1:${server.address().port}`);
  });
  const stop = () => { server.close(); server.closeAllConnections?.(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

module.exports = { createServer };
