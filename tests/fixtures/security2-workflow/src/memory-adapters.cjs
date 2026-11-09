'use strict';

const { randomUUID } = require('node:crypto');

const nextTurn = () => new Promise(resolve => setImmediate(resolve));

class MemoryRequests {
  constructor({ io = nextTurn } = {}) {
    this.io = io;
    this.rows = new Map();
  }

  async get(id) {
    const value = this.rows.get(id);
    const snapshot = value ? { ...value } : null;
    await this.io({ kind: 'read-request', id });
    return snapshot;
  }

  async put(value) {
    await this.io({ kind: 'write-request', id: value.id });
    this.rows.set(value.id, { ...value });
    return { ...value };
  }
}

class MemoryLedger {
  constructor({ io = nextTurn } = {}) {
    this.io = io;
    this.entries = [];
  }

  async record({ requestId, amount, payee, recordedBy }) {
    await this.io({ kind: 'record-payment', id: requestId });
    const entry = { id: randomUUID(), requestId, amount, payee, recordedBy };
    this.entries.push(entry);
    return { ...entry };
  }

  list(requestId) {
    return this.entries.filter(entry => !requestId || entry.requestId === requestId)
      .map(entry => ({ ...entry }));
  }
}

module.exports = { MemoryRequests, MemoryLedger };
