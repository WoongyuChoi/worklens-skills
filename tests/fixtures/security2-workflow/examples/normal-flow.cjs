'use strict';

const assert = require('node:assert/strict');
const { MemoryRequests, MemoryLedger } = require('../src/memory-adapters.cjs');
const { ApprovalService } = require('../src/approval-service.cjs');

async function main() {
  const requests = new MemoryRequests();
  const ledger = new MemoryLedger();
  const service = new ApprovalService({ requests, ledger });
  const applicant = { id: 'employee-sample-a', roles: ['employee'] };
  const approver = { id: 'manager-sample-b', roles: ['approver'] };
  const finance = { id: 'finance-sample-c', roles: ['finance'] };
  const request = await service.create(applicant, { title: '합성 보안 교육', amount: 42000 });
  await service.submit(applicant, request.id);
  await service.approve(approver, request.id);
  const receipt = await service.pay(finance, request.id);
  assert.equal(receipt.amount, 42000);
  assert.equal(ledger.list(request.id).length, 1);
  assert.equal((await requests.get(request.id)).state, 'PAID');
  console.log('정상 예제 완료: 초안 → 제출 → 승인 → 지급 완료');
  console.log('합성 전표 1건, 금액 42,000원. 실제 송금이나 외부 연결은 없습니다.');
}

main().catch(error => {
  console.error('예제 실행 실패:', error.code || error.message);
  process.exitCode = 1;
});
