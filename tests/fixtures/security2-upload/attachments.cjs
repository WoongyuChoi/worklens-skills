"use strict";

const { randomUUID } = require("node:crypto");

const MAX_FILES = 8;
const MAX_BYTES = 4096;
const TYPES = new Map([["txt", "text/plain"], ["csv", "text/csv"]]);

function validateBatch(files) {
  if (!Array.isArray(files) || files.length > MAX_FILES) return "파일 개수가 범위를 벗어났습니다.";
  for (const file of files) {
    if (!file || typeof file !== "object") return "파일 항목 형식이 올바르지 않습니다.";
    if (file.empty === true) return null;
    if (typeof file.filename !== "string" || !/^[A-Za-z0-9가-힣 _.-]{1,80}$/.test(file.filename)) {
      return "파일 이름이 올바르지 않습니다.";
    }
    const extension = file.filename.split(".").at(-1).toLowerCase();
    if (!TYPES.has(extension) || TYPES.get(extension) !== file.mediaType) return "허용한 문서 형식이 아닙니다.";
    if (typeof file.text !== "string" || file.text.includes("\u0000")) return "텍스트 문서만 등록할 수 있습니다.";
    if (Buffer.byteLength(file.text, "utf8") > MAX_BYTES) return "파일 크기가 범위를 벗어났습니다.";
  }
  return null;
}

class AttachmentStore {
  constructor() {
    this.records = new Map();
  }

  submit(files) {
    const error = validateBatch(files);
    if (error) return { status: 422, body: { error } };
    const records = files.filter(file => file.empty !== true).map(file => ({
      id: randomUUID(),
      filename: String(file.filename),
      mediaType: String(file.mediaType),
      text: String(file.text),
      state: "pending"
    }));
    for (const record of records) this.records.set(record.id, record);
    return { status: 201, body: { items: records.map(record => this.metadata(record)) } };
  }

  metadata(record) {
    return { id: record.id, filename: record.filename, mediaType: record.mediaType, state: record.state };
  }

  list() {
    return [...this.records.values()].map(record => this.metadata(record));
  }

  review(id, decision) {
    const record = this.records.get(id);
    if (!record) return { status: 404, body: { error: "첨부파일이 없습니다." } };
    if (decision !== "approved" && decision !== "rejected") return { status: 422, body: { error: "심사 결과가 올바르지 않습니다." } };
    if (record.state !== "pending") return { status: 409, body: { error: "이미 심사한 첨부파일입니다." } };
    record.state = decision;
    return { status: 200, body: this.metadata(record) };
  }

  download(id) {
    return this.records.get(id) || null;
  }

  remove(id) {
    return this.records.delete(id);
  }
}

module.exports = { AttachmentStore, validateBatch, MAX_FILES, MAX_BYTES };
