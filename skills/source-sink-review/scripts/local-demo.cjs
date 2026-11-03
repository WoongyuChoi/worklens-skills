#!/usr/bin/env node
'use strict';

// Executes the bundled original fixture only. No source discovery or target-code loading.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const demo = require('../assets/demo-flow.cjs');

function observe(call, expectedDenialCode) {
  try { return { accepted: true, result: call() }; }
  catch (error) {
    if (error.code !== expectedDenialCode) throw error;
    return { accepted: false, code: error.code, reason: error.message };
  }
}

function runDemo(options = {}) {
  const temporary = fs.mkdtempSync(path.join(options.tempParent || os.tmpdir(), 'worklens-source-demo-'));
  try {
    const publicRoot = path.join(temporary, 'public');
    fs.mkdirSync(publicRoot);
    fs.writeFileSync(path.join(publicRoot, 'manual-0012.txt'), 'WORKLENS_PUBLIC_0012', { flag: 'wx' });
    fs.writeFileSync(path.join(temporary, 'local-canary.txt'), 'WORKLENS_DEMO_CANARY_0012', { flag: 'wx' });
    const sortInput = 'display_name DESC';
    const sql = demo.queryVulnerable(sortInput);
    const sortRejected = observe(() => demo.queryFixed(sortInput, 'desc'), 'SORT_KEY_DENIED');
    const sortAccepted = demo.queryFixed('name', 'desc');
    const fileInput = '../local-canary.txt';
    const fileRead = demo.readVulnerable(publicRoot, fileInput);
    const fileRejected = observe(() => demo.readFixed(publicRoot, fileInput), 'FILE_ROOT_DENIED');
    const fileAccepted = demo.readFixed(publicRoot, 'manual-0012.txt');
    const urlInput = 'https://external.example.invalid/preview';
    const urlPlan = demo.requestPlanVulnerable(urlInput);
    const urlRejected = observe(() => demo.requestPlanFixed(urlInput), 'URL_ORIGIN_DENIED');
    const urlAccepted = demo.requestPlanFixed('/catalog/0012');
    if (sortRejected.accepted || fileRejected.accepted || urlRejected.accepted) {
      throw new Error('수정 예제가 예상한 경계를 막지 못했습니다. 데모 결과를 성공으로 저장하지 않습니다.');
    }
    const evidence = (kind, location, detail) => ({ kind, location, detail });
    const coverage = (target, detail) => ({ target, status: 'executed', detail });
    return {
      schema: 'worklens-security-report/v1',
      title: '로컬 합성 예제: 입력 경로와 보호 코드 비교',
      skill: 'source-sink-review',
      generatedAt: new Date().toISOString(),
      mode: 'local-demo',
      scope: {
        description: '동봉한 원본 예제 코드의 관측 결과입니다. 실제 사내 저장소·서비스·CVE 재현 결과가 아닙니다.',
        targets: ['assets/demo-flow.cjs:queryVulnerable/queryFixed',
          'assets/demo-flow.cjs:readVulnerable/readFixed',
          'assets/demo-flow.cjs:requestPlanVulnerable/requestPlanFixed'],
        vantage: 'Node 표준 모듈; 새 임시 디렉터리의 합성 파일; SQL·URL 문자열 구성만 실행',
        limitations: ['DB 연결·SQL 실행·HTTP 요청·프로세스 실행을 하지 않았습니다.',
          '실제 애플리케이션의 호출자·인증·인가·배포 경로를 검사하지 않았습니다.',
          '동시 파일 교체, DNS, 리다이렉트, 프록시 정책은 이 예제로 검증되지 않습니다.',
          'confirmed는 아래에 적힌 로컬 관측 사실에만 해당합니다. 실제 CVE 성립이나 업무 피해를 확정하지 않습니다.']
      },
      findings: [
        {
          id: 'DEMO-SQL-001', title: '로컬 예제: 정렬 원문이 SQL 구조에 합쳐짐', severity: 'info', status: 'confirmed',
          summary: '문자열 구성 함수에서 정렬 원문이 ORDER BY 뒤로 전달되었습니다. 실제 SQL 파싱이나 데이터 접근은 실행하지 않았습니다.',
          evidence: [evidence('source', 'assets/demo-flow.cjs:queryVulnerable', '입력 정렬 문자열을 고정 SQL 뒤에 직접 연결합니다.'),
            evidence('runtime', 'local-demo:sql-builder', JSON.stringify({ input: sortInput, sql })),
            evidence('runtime', 'local-demo:sql-fixed', JSON.stringify({ rejected: sortRejected, validControl: sortAccepted }))],
          conditions: ['동봉한 가상 함수의 입력만 사용했습니다.', '실서비스 결론에는 외부 제어 가능성, 실제 SQL 호출과 DB 동작 근거가 추가로 필요합니다.'],
          fix: ['외부 키 name을 고정 컬럼 display_name에 매핑하고 direction을 asc/desc로 제한합니다.', '데이터 값 바인딩과 식별자·정렬 구조 제어를 별도로 검토합니다.'],
          retest: ['동일 정렬 원문이 queryFixed에서 거부됨을 관측했습니다.', '정상 키 name + desc의 SQL 구성이 유지됨을 관측했습니다.'],
          flow: [{ label: '입력', detail: sortInput }, { label: '취약한 연결', detail: sql },
            { label: '수정 후', detail: '정렬 키 매핑 이전에 비허용 키 거부; 정상 키는 허용' }]
        },
        {
          id: 'DEMO-FILE-001', title: '로컬 예제: 허용 하위 폴더 밖의 합성 파일 읽기', severity: 'info', status: 'confirmed',
          summary: '직접 만든 임시 폴더 안에서 public의 형제 canary 파일이 읽혔습니다. 실제 업무 파일에는 접근하지 않았습니다.',
          evidence: [evidence('source', 'assets/demo-flow.cjs:readVulnerable', '경로 결합 후 루트 경계 검사 없이 파일을 읽습니다.'),
            evidence('runtime', 'local-demo:file-read', JSON.stringify({ input: fileInput, relativeToAllowedRoot: path.relative(publicRoot, fileRead.path), content: fileRead.content })),
            evidence('runtime', 'local-demo:file-fixed', JSON.stringify({ rejected: fileRejected, validControl: fileAccepted.content }))],
          conditions: ['canary와 정상 파일은 이 실행이 만든 임시 디렉터리 안에만 있습니다.', '동시 작성자가 없는 예제입니다. 실환경의 링크 교체 경쟁은 미검증입니다.'],
          fix: ['정규화한 경로의 구성요소로 포함 관계를 검사합니다.', '기존 파일의 실제 경로도 검사하고 동시 파일 교체 가능성을 별도로 설계합니다.'],
          retest: ['형제 파일 입력은 readFixed에서 거부됨을 관측했습니다.', '정상 manual-0012.txt의 읽기가 유지됨을 관측했습니다.'],
          flow: [{ label: '허용 루트', detail: '$DEMO_ROOT/public' }, { label: '입력', detail: fileInput },
            { label: '관측', detail: '임시 canary 값 읽힘; 수정 경로는 거부' }]
        },
        {
          id: 'DEMO-URL-001', title: '로컬 예제: 입력 URL이 요청 계획의 출처를 바꿈', severity: 'info', status: 'confirmed',
          summary: 'URL 구성 결과가 고정 출처에서 다른 .invalid 출처로 바뀌었습니다. HTTP 요청이 발생한 것은 아니며 SSRF 성공 판정이 아닙니다.',
          evidence: [evidence('source', 'assets/demo-flow.cjs:requestPlanVulnerable', '외부 값을 URL로 해석해 요청 계획을 생성합니다.'),
            evidence('runtime', 'local-demo:url-plan', JSON.stringify({ input: urlInput, plan: urlPlan })),
            evidence('runtime', 'local-demo:url-fixed', JSON.stringify({ rejected: urlRejected, validControl: urlAccepted }))],
          conditions: ['실제 HTTP client, DNS, 프록시, 리다이렉트는 없습니다.', '실서비스 결론에는 이 계획이 실제 요청으로 이어지는 호출 경로와 네트워크 정책 근거가 필요합니다.'],
          fix: ['파싱된 URL 출처를 고정된 HTTPS 정책과 비교하고 URL 내 자격증명을 거부합니다.', '실제 client의 리다이렉트·DNS·프록시 처리 경계는 별도로 검증합니다.'],
          retest: ['다른 출처의 계획은 requestPlanFixed에서 거부됨을 관측했습니다.', '정상 상대 경로 /catalog/0012의 계획 생성은 유지됨을 관측했습니다.'],
          flow: [{ label: '기준 출처', detail: demo.BASE_URL }, { label: '입력', detail: urlInput },
            { label: '관측', detail: '취약한 계획은 외부 출처; 수정 계획은 거부; 네트워크 호출 없음' }]
        }
      ],
      coverage: [coverage('SQL 원문 연결', 'SQL 문자열 구성만 관측; DB 실행 없음'),
        coverage('SQL 키 매핑', '비허용 키 거부와 정상 키 통과'),
        coverage('파일 경로 결합', '임시 sibling canary 읽기'),
        coverage('파일 경계 검사', '상위 경로 거부와 정상 파일 통과'),
        coverage('URL 계획 구성', '다른 출처로 구성됨; HTTP 실행 없음'),
        coverage('URL 출처 검사', '다른 출처 거부와 정상 상대 URL 통과'),
        { target: '사내 애플리케이션 및 알려진 CVE', status: 'not-executed', detail: '이 데모의 검사 대상이 아닙니다.' }],
      sources: []
    };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write('사용법: node scripts/local-demo.cjs [--out 새-결과.json]\n동봉한 합성 예제만 실행하며 기존 결과 파일은 덮어쓰지 않습니다.\n');
    return;
  }
  if (!(args.length === 0 || (args.length === 2 && args[0] === '--out' && args[1] && !args[1].startsWith('--')))) {
    throw new Error('사용법: node scripts/local-demo.cjs [--out 새-결과.json]');
  }
  const report = JSON.stringify(runDemo(), null, 2) + '\n';
  if (args.length) fs.writeFileSync(args[1], report, { encoding: 'utf8', flag: 'wx' });
  else process.stdout.write(report);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write('로컬 데모 실패: ' + error.message + '\n'); process.exitCode = 2; }
}
module.exports = { runDemo };
