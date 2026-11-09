'use strict';

const { randomUUID } = require('node:crypto');

class WorkflowError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

class ApprovalService {
  constructor({ requests, ledger }) {
    this.requests = requests;
    this.ledger = ledger;
  }

  requireRole(principal, role) {
    if (!principal || !Array.isArray(principal.roles) || !principal.roles.includes(role)) {
      throw new WorkflowError('FORBIDDEN');
    }
  }

  async load(id) {
    const row = await this.requests.get(id);
    if (!row) throw new WorkflowError('NOT_FOUND');
    return row;
  }

  async create(principal, { title, amount }) {
    this.requireRole(principal, 'employee');
    if (typeof title !== 'string' || !title.trim() || !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000) {
      throw new WorkflowError('INVALID_REQUEST');
    }
    return this.requests.put({
      id: randomUUID(), owner: principal.id, title, amount, state: 'DRAFT', approvedBy: null
    });
  }

  async submit(principal, id) {
    const row = await this.load(id);
    if (row.owner !== principal.id) throw new WorkflowError('FORBIDDEN');
    if (row.state !== 'DRAFT') throw new WorkflowError('INVALID_STATE');
    return this.requests.put({ ...row, state: 'SUBMITTED' });
  }

  async approve(principal, id) {
    this.requireRole(principal, 'approver');
    const row = await this.load(id);
    if (row.owner === principal.id) throw new WorkflowError('SELF_APPROVAL');
    if (row.state !== 'SUBMITTED') throw new WorkflowError('INVALID_STATE');
    return this.requests.put({ ...row, state: 'APPROVED', approvedBy: principal.id });
  }

  async cancel(principal, id) {
    const row = await this.load(id);
    if (row.owner !== principal.id) throw new WorkflowError('FORBIDDEN');
    if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(row.state)) throw new WorkflowError('INVALID_STATE');
    return this.requests.put({ ...row, state: 'CANCELLED' });
  }

  async pay(principal, id) {
    this.requireRole(principal, 'finance');
    const row = await this.load(id);
    if (row.state === 'CANCELLED' || row.state === 'PAID') throw new WorkflowError('INVALID_STATE');
    const receipt = await this.ledger.record({
      requestId: row.id, amount: row.amount, payee: row.owner, recordedBy: principal.id
    });
    await this.requests.put({ ...row, state: 'PAID', receiptId: receipt.id });
    return receipt;
  }
}

module.exports = { ApprovalService, WorkflowError };
