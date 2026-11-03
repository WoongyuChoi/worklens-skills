#!/usr/bin/env node
'use strict';

// Offline, bounded input processing. Never emit input values, excerpts, hashes or paths.
const fs=require('node:fs');
const {TextDecoder}=require('node:util');
const DEFAULT_LIMITS=Object.freeze({maxBytes:10485760,maxLineBytes:65536,maxLines:50000,maxDepth:12,maxNodesPerLine:2048,maxEvidenceLines:20});
const SAFE_ID=/^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const SAFE_KEY=/^[A-Za-z_][A-Za-z0-9_.-]{0,95}$/;
const SYNTHETIC=/^WL_SYNTHETIC_[A-Za-z0-9_-]{1,100}$/;
const REDACTED=new Set(['[REDACTED]','[REMOVED]','***']);
class AuditError extends Error{constructor(code,message){super(message);this.code=code;}}
function fail(code,message){throw new AuditError(code,message);}
function keys(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('INVALID_RULES','규칙은 JSON 객체여야 합니다.');if(Object.keys(value).some(key=>!allowed.includes(key)))fail('INVALID_RULES','지원하지 않는 규칙 필드가 있습니다.');}
function id(value){if(typeof value!=='string'||!SAFE_ID.test(value))fail('INVALID_ID','ID에는 영문으로 시작하는 1–64자의 영문·숫자·하이픈·밑줄만 허용합니다.');}
function pointer(value){
  if(typeof value!=='string'||!value.startsWith('/')||value.length>256||/~(?![01])/.test(value)||/[\u0000-\u001f]/.test(value))fail('INVALID_SELECTOR','JSON pointer 형식이 잘못되었습니다.');
  const parts=value.slice(1).split('/').map(part=>part.replace(/~1/g,'/').replace(/~0/g,'~'));
  if(parts.length>32||parts.some(part=>['__proto__','prototype','constructor'].includes(part)))fail('INVALID_SELECTOR','JSON pointer의 깊이 또는 항목이 지원 범위를 벗어났습니다.');
  return parts;
}
function selectors(item){
  const jsonPointers=item.jsonPointers===undefined?[]:item.jsonPointers;
  const kvKeys=item.kvKeys===undefined?[]:item.kvKeys;
  if(!Array.isArray(jsonPointers)||!Array.isArray(kvKeys)||jsonPointers.length+kvKeys.length<1||jsonPointers.length>16||kvKeys.length>16)fail('INVALID_SELECTOR','각 필드에는 제한된 JSON pointer 또는 key/value 키가 필요합니다.');
  if(kvKeys.some(key=>typeof key!=='string'||!SAFE_KEY.test(key)))fail('INVALID_SELECTOR','key/value 키 형식이 잘못되었습니다.');
  if(new Set(jsonPointers).size!==jsonPointers.length||new Set(kvKeys).size!==kvKeys.length)fail('INVALID_SELECTOR','선택자가 중복됩니다.');
  return {jsonPointers:[...jsonPointers],tokens:jsonPointers.map(pointer),kvKeys:[...kvKeys]};
}
function validatePolicy(raw){
  keys(raw,['schema','policySource','fields','requiredFields','canaries','limits']);
  if(raw.schema!=='worklens-privacy-policy/v1')fail('INVALID_SCHEMA','지원하지 않는 개인정보 로그 규칙 버전입니다.');
  let policySource=null;
  if(raw.policySource!==undefined){
    keys(raw.policySource,['path','line']);
    if(typeof raw.policySource.path!=='string'||raw.policySource.path.length>256||/[\u0000-\u001f\u007f\\:]/.test(raw.policySource.path)||raw.policySource.path.startsWith('/')||raw.policySource.path.split('/').some(part=>part==='..'||part==='.'))fail('INVALID_SOURCE','정책 근거는 비밀정보 없는 프로젝트 상대 경로여야 합니다.');
    if(!Number.isSafeInteger(raw.policySource.line)||raw.policySource.line<1)fail('INVALID_SOURCE','정책 근거 행 번호가 필요합니다.');
    policySource={...raw.policySource};
  }
  const limits={...DEFAULT_LIMITS};
  if(raw.limits!==undefined){keys(raw.limits,Object.keys(DEFAULT_LIMITS));Object.assign(limits,raw.limits);}
  const ranges={maxBytes:[256,104857600],maxLineBytes:[128,1048576],maxLines:[1,1000000],maxDepth:[1,32],maxNodesPerLine:[4,10000],maxEvidenceLines:[1,50]};
  for(const [key,[min,max]]of Object.entries(ranges))if(!Number.isSafeInteger(limits[key])||limits[key]<min||limits[key]>max)fail('INVALID_LIMIT','입력·행·구조·증거 제한이 허용 범위를 벗어났습니다.');
  if(!Array.isArray(raw.fields)||raw.fields.length<1||raw.fields.length>128)fail('INVALID_FIELDS','1–128개의 검토 필드가 필요합니다.');
  const ids=new Set();
  const fields=raw.fields.map(field=>{
    keys(field,['id','classification','decision','policyConfirmed','jsonPointers','kvKeys']);id(field.id);
    if(ids.has(field.id))fail('DUPLICATE_ID','필드 ID가 중복됩니다.');ids.add(field.id);
    if(!['personal','sensitive','credential','candidate'].includes(field.classification)||!['exclude','review','allow'].includes(field.decision)||typeof field.policyConfirmed!=='boolean')fail('INVALID_FIELDS','필드 분류·결정·정책 확인 여부가 잘못되었습니다.');
    if(field.policyConfirmed&&!policySource)fail('MISSING_POLICY_SOURCE','확정 정책에는 실제 근거 위치가 필요합니다.');
    return {id:field.id,classification:field.classification,decision:field.decision,policyConfirmed:field.policyConfirmed,...selectors(field)};
  });
  if(!Array.isArray(raw.requiredFields)||raw.requiredFields.length>32)fail('INVALID_REQUIRED','requiredFields는 최대 32개 항목의 배열이어야 합니다.');
  const requiredFields=raw.requiredFields.map(field=>{
    keys(field,['id','type','jsonPointers','kvKeys']);id(field.id);
    if(ids.has(field.id))fail('DUPLICATE_ID','필수 필드와 개인정보 필드의 ID가 중복됩니다.');ids.add(field.id);
    if(!['string','number','any'].includes(field.type))fail('INVALID_REQUIRED','필수 필드 type은 string/number/any 중 하나여야 합니다.');
    return {id:field.id,type:field.type,...selectors(field)};
  });
  for(const field of fields.filter(item=>item.decision==='exclude'))for(const required of requiredFields){
    if(field.jsonPointers.some(value=>required.jsonPointers.includes(value))||field.kvKeys.some(value=>required.kvKeys.includes(value)))fail('CONFLICTING_POLICY','같은 필드를 출력 제외와 필수 관측으로 동시에 지정할 수 없습니다.');
  }
  const canaries=raw.canaries===undefined?[]:raw.canaries;
  if(!Array.isArray(canaries)||canaries.length>128)fail('INVALID_CANARY','합성 canary 목록이 너무 큽니다.');
  const usedCanaries=new Set();
  const normalizedCanaries=canaries.map(item=>{
    keys(item,['field','value']);
    if(!fields.some(field=>field.id===item.field)||typeof item.value!=='string'||!SYNTHETIC.test(item.value)||usedCanaries.has(item.value))fail('INVALID_CANARY','Canary는 등록된 필드와 중복 없는 WL_SYNTHETIC_ 합성 문자열이어야 합니다.');
    usedCanaries.add(item.value);return {field:item.field,value:item.value};
  });
  return {policySource,limits,fields,requiredFields,canaries:normalizedCanaries};
}
function structureProblem(text,limits){
  // JSON.parse handles grammar; this pass rejects overwritten duplicate keys and deep shapes.
  const stack=[];
  for(let index=0;index<text.length;index++){
    const ch=text[index];
    if(ch==='"'){
      const start=index++;
      for(;index<text.length;index++){if(text[index]==='\\'){index++;continue;}if(text[index]==='"')break;}
      let next=index+1;while(/\s/.test(text[next]||'')&&next<text.length)next++;
      if(text[next]===':'&&stack.at(-1)instanceof Set){
        let key;try{key=JSON.parse(text.slice(start,index+1));}catch{return 'invalid-json';}
        if(stack.at(-1).has(key))return 'duplicate-keys';stack.at(-1).add(key);
      }
    }else if(ch==='{'||ch==='['){stack.push(ch==='{'?new Set():null);if(stack.length>limits.maxDepth)return 'depth-limit';}
    else if(ch==='}'||ch===']')stack.pop();
  }
  return null;
}
function scalarStrings(value,limits){
  const strings=[],stack=[value];let nodes=0;
  while(stack.length){
    const next=stack.pop();if(++nodes>limits.maxNodesPerLine)return null;
    if(typeof next==='string')strings.push(next);
    else if(next&&typeof next==='object'){const children=Object.values(next);if(children.length+nodes>limits.maxNodesPerLine)return null;for(const child of children)stack.push(child);}
  }
  return strings;
}
function parseKV(text,limits){
  const result=Object.create(null);let index=0,count=0;
  while(index<text.length){
    while(index<text.length&&/[ \t]/.test(text[index]))index++;
    if(index>=text.length)break;
    const match=/^[A-Za-z_][A-Za-z0-9_.-]*=/.exec(text.slice(index));
    if(!match)return null;
    const key=match[0].slice(0,-1);index+=match[0].length;
    if(key.length>96||Object.prototype.hasOwnProperty.call(result,key)||++count>limits.maxNodesPerLine)return null;
    let value;
    if(text[index]==='"'){
      const start=index++;
      let ended=false;
      for(;index<text.length;index++){if(text[index]==='\\'){index++;continue;}if(text[index]==='"'){index++;ended=true;break;}}
      if(!ended)return null;
      try{value=JSON.parse(text.slice(start,index));}catch{return null;}
      if(index<text.length&&!/[ \t]/.test(text[index]))return null;
    }else{
      const start=index;while(index<text.length&&!/[ \t]/.test(text[index]))index++;
      value=text.slice(start,index);if(!value||/["'{}\[\]\\\r\n]/.test(value))return null;
    }
    result[key]=value;
  }
  return count?result:null;
}
function pointerValues(record,parts){
  let values=[record];
  for(const part of parts){
    const next=[];
    for(const value of values){
      if(part==='*'){if(Array.isArray(value))next.push(...value);}
      else if(value&&typeof value==='object'&&Object.prototype.hasOwnProperty.call(value,part))next.push(value[part]);
    }
    values=next;
  }
  return values;
}
function selectedValues(record,format,field){
  if(format==='jsonl')return field.tokens.flatMap(parts=>pointerValues(record,parts));
  return field.kvKeys.filter(key=>Object.prototype.hasOwnProperty.call(record,key)).map(key=>record[key]);
}
function empty(value){return value===null||value===undefined||value==='';}
function safeRepresentation(value){return empty(value)||(typeof value==='string'&&REDACTED.has(value));}
function requiredValid(values,type,format){
  return values.some(value=>{
    if(empty(value))return false;
    if(type==='any')return true;
    if(type==='string')return typeof value==='string'&&value.trim().length>0&&!REDACTED.has(value);
    return typeof value==='number'?Number.isFinite(value):format==='kv'&&typeof value==='string'&&/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)&&Number.isFinite(Number(value));
  });
}
function addLine(rows,line,max){if(rows.length<max)rows.push(line);}
async function scanFile(inputFile,rawPolicy,options={}){
  const policy=validatePolicy(rawPolicy),format=options.format||'jsonl',label=options.label||'local-log';id(label);
  if(!['jsonl','kv'].includes(format))fail('INVALID_FORMAT','지원 형식은 jsonl 또는 kv입니다.');
  const fields=policy.fields.map(field=>({id:field.id,classification:field.classification,decision:field.decision,policyConfirmed:field.policyConfirmed,presentRows:0,nonEmptyRows:0,redactedOrEmptyRows:0,canaryRows:0,lines:[]}));
  const required=policy.requiredFields.map(field=>({id:field.id,validRows:0,missingRows:0,lines:[]}));
  const summary={physicalLines:0,parsedLines:0,blankLines:0,unknownLines:0,bytesRead:0,fileFullyRead:false};
  const unknown=new Map();
  const unknownRow=(reason,line)=>{summary.unknownLines++;if(!unknown.has(reason))unknown.set(reason,{reason,count:0,lines:[]});const row=unknown.get(reason);row.count++;addLine(row.lines,line,policy.limits.maxEvidenceLines);};
  const decoder=new TextDecoder('utf-8',{fatal:true});
  function inspect(buffer,oversized=false,incomplete=false){
    const line=++summary.physicalLines;
    if(oversized){unknownRow('oversize-line',line);return;}
    if(incomplete){unknownRow('input-limit',line);return;}
    let text;
    try{text=decoder.decode(buffer);if(line===1&&text.startsWith('\uFEFF'))text=text.slice(1);}catch{unknownRow('invalid-utf8',line);return;}
    if(text.endsWith('\r'))text=text.slice(0,-1);
    if(!text.trim()){summary.blankLines++;return;}
    let record,strings;
    if(format==='jsonl'){
      const problem=structureProblem(text,policy.limits);if(problem){unknownRow(problem,line);return;}
      try{record=JSON.parse(text);}catch{unknownRow('invalid-json',line);return;}
      if(!record||typeof record!=='object'||Array.isArray(record)){unknownRow('invalid-json',line);return;}
      strings=scalarStrings(record,policy.limits);if(!strings){unknownRow('node-limit',line);return;}
    }else{
      record=parseKV(text,policy.limits);if(!record){unknownRow('invalid-kv',line);return;}strings=Object.values(record);
    }
    summary.parsedLines++;
    for(let index=0;index<policy.fields.length;index++){
      const field=policy.fields[index],stats=fields[index],values=selectedValues(record,format,field);
      const canary=policy.canaries.some(item=>item.field===field.id&&strings.some(value=>value.includes(item.value)));
      if(values.length){stats.presentRows++;if(values.some(value=>!safeRepresentation(value)))stats.nonEmptyRows++;else stats.redactedOrEmptyRows++;}
      if(canary)stats.canaryRows++;
      if(values.length||canary)addLine(stats.lines,line,policy.limits.maxEvidenceLines);
    }
    for(let index=0;index<policy.requiredFields.length;index++){
      const field=policy.requiredFields[index],stats=required[index];
      if(requiredValid(selectedValues(record,format,field),field.type,format))stats.validRows++;
      else{stats.missingRows++;addLine(stats.lines,line,policy.limits.maxEvidenceLines);}
    }
  }
  let file;
  try{
    file=await fs.promises.open(inputFile,'r');
    const before=await file.stat();if(!before.isFile())fail('INVALID_INPUT','일반 로컬 파일만 읽을 수 있습니다.');
    const readLimit=Math.min(before.size,policy.limits.maxBytes),chunk=Buffer.alloc(Math.min(16384,policy.limits.maxBytes));
    let position=0,parts=[],lineBytes=0,oversized=false,lineHasBytes=false,stopped=false;
    while(position<readLimit&&!stopped){
      const {bytesRead}=await file.read(chunk,0,Math.min(chunk.length,readLimit-position),position);if(!bytesRead)break;
      position+=bytesRead;summary.bytesRead+=bytesRead;
      let start=0;
      for(let index=0;index<bytesRead;index++){
        if(chunk[index]!==10)continue;
        const piece=chunk.subarray(start,index);lineHasBytes=lineHasBytes||piece.length>0;lineBytes+=piece.length;
        if(lineBytes>policy.limits.maxLineBytes){oversized=true;parts=[];}else if(!oversized)parts.push(Buffer.from(piece));
        inspect(oversized?Buffer.alloc(0):Buffer.concat(parts),oversized);
        parts=[];lineBytes=0;oversized=false;lineHasBytes=false;start=index+1;
        if(summary.physicalLines>=policy.limits.maxLines){stopped=true;break;}
      }
      if(!stopped&&start<bytesRead){const piece=chunk.subarray(start,bytesRead);lineHasBytes=true;lineBytes+=piece.length;if(lineBytes>policy.limits.maxLineBytes){oversized=true;parts=[];}else if(!oversized)parts.push(Buffer.from(piece));}
    }
    if(!stopped&&(lineHasBytes||parts.length||oversized))inspect(oversized?Buffer.alloc(0):Buffer.concat(parts),oversized,before.size>readLimit);
    const after=await file.stat();
    summary.fileFullyRead=!stopped&&position===before.size&&before.size===after.size&&before.mtimeMs===after.mtimeMs;
    // Reaching maxLines exactly at EOF is complete only if every byte was processed.
    if(stopped)summary.fileFullyRead=false;
    if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)unknown.set('file-changed',{reason:'file-changed',count:1,lines:[]});
    if(!summary.fileFullyRead&&!unknown.has('input-limit'))unknown.set('input-limit',{reason:'input-limit',count:1,lines:[]});
  }catch(error){if(error instanceof AuditError)throw error;fail('INPUT_READ','입력을 읽지 못했습니다. 경로·내용·운영체제 오류는 출력하지 않습니다.');}
  finally{if(file)await file.close().catch(()=>{});}
  // The result contains rule IDs, line numbers and counts only, never selectors or input values.
  return {label,format,summary,fields,required,unknown:[...unknown.values()],policySource:policy.policySource};
}
function toReport(result,options={}){
  const mode=options.mode==='local-demo'?'local-demo':'evidence-review';
  const findings=[];
  for(const field of result.fields){
    if(field.decision==='allow'||(!field.presentRows&&!field.canaryRows))continue;
    const policyViolation=field.policyConfirmed&&field.decision==='exclude';
    const confirmed=policyViolation&&(field.nonEmptyRows>0||field.canaryRows>0);
    const evidence=[{kind:'trace',location:result.label+':'+field.lines.join(','),detail:`field=${field.id}; present=${field.presentRows}; nonempty=${field.nonEmptyRows}; redacted-or-empty=${field.redactedOrEmptyRows}; synthetic-canary=${field.canaryRows}. 원문·부분값·해시는 기록하지 않음.`}];
    if(result.policySource)evidence.push({kind:'source',location:result.policySource.path+':'+result.policySource.line,detail:'규칙 작성자가 지정한 분류·출력 정책 근거. 스캐너가 업무 정책이나 소스 흐름을 자동 검증하지 않음.'});
    findings.push({id:'privacy-'+field.id,title:confirmed?'등록된 출력 제외 필드가 기록에서 관측됨':'로그 출력 필드의 정책·필요성 검토',severity:confirmed?'medium':'info',status:confirmed?'confirmed':'suspected',summary:confirmed?'등록된 제외 정책과 달리 검토한 기록에서 비어 있지 않은 값 또는 합성 canary를 관측함. 해당 기록의 정책 위반 관측에 한정하며 실제 개인 식별 여부·시스템 전체 노출을 확정하지 않음.':'필드명·표현 형식만으로 실제 개인정보를 확정하지 않음. 값이 가려져 있어도 불필요한 필드를 출력에서 제외했는지는 별도로 검토해야 함.',evidence,conditions:['이름·형식 일치만으로 업무상 개인정보 또는 실제 개인을 식별했다고 판단하지 않음.','입력 기록·등록된 선택자·지원 형식·읽기 제한 범위에만 해당함.'],fix:['DTO 전체·요청/응답 body·SQL 바인드 값·예외 메시지의 불필요한 출력을 원천에서 제외하세요.','traceId·errorCode·service·duration 등 승인된 관측 필드는 명시적 허용 목록으로 유지하세요.'],retest:['동일한 합성 canary로 수정 전후 출력과 각 appender 경로를 비교하세요.','금지 필드·canary가 없어지고 필수 관측 필드가 유지되는지 함께 확인하세요.'],flow:[{label:'분류',detail:field.policyConfirmed?'등록 정책 근거 있음':'업무 분류·정책 미확정'},{label:'경로',detail:'소스→DTO/직렬화→logger→appender 경로는 별도로 추적해야 함.'},{label:'관측',detail:`field=${field.id}; lines=${field.lines.join(',')}; count=${field.presentRows}; canary-count=${field.canaryRows}`},{label:'수정',detail:'불필요한 출력 제외와 관측 필드 유지'}]});
  }
  for(const field of result.required.filter(item=>item.missingRows>0))findings.push({id:'observability-'+field.id,title:'필수 관측 필드 누락 또는 형식 미충족',severity:'low',status:'suspected',summary:'개인정보 출력 축소와 별도로 진단·사건 추적에 필요한 필드가 유지되는지 확인해야 함.',evidence:[{kind:'trace',location:result.label+':'+field.lines.join(','),detail:`field=${field.id}; missing-count=${field.missingRows}; valid-count=${field.validRows}`}],conditions:['지정한 지원 형식으로 해석된 기록에 한정함.'],fix:['민감 DTO 전체를 다시 출력하지 말고 필요한 관측 필드만 명시적으로 구성하세요.'],retest:['같은 합성 요청의 오류·성공 경로에서 필수 필드 유지 여부를 확인하세요.'],flow:[]});
  const coverage=[{target:result.label,status:result.summary.fileFullyRead&&result.summary.unknownLines===0&&result.summary.parsedLines>0?'tested':'unknown',detail:`관측 물리행 ${result.summary.physicalLines}; 지원 형식 ${result.summary.parsedLines}; 빈 행 ${result.summary.blankLines}; 해석 미확정 ${result.summary.unknownLines}; 전체 파일 읽음 ${result.summary.fileFullyRead?'예':'아니오'}. 읽지 않은 나머지 행 수는 알 수 없음.`}];
  for(const row of result.unknown)coverage.push({target:result.label+'/'+row.reason,status:'unknown',detail:`line=${row.lines.join(',')||'미확정'}; count=${row.count}. 미지원·제한 구간은 안전으로 판정하지 않음.`});
  for(const field of result.required)coverage.push({target:field.id,status:field.missingRows===0&&result.summary.parsedLines>0?'tested':'unknown',detail:`valid-count=${field.validRows}; missing-count=${field.missingRows}. 입력 값은 기록하지 않음.`});
  return {schema:'worklens-security-report/v1',title:'개인정보 로그 출력 점검',skill:'privacy-log-audit',generatedAt:new Date().toISOString(),mode,scope:{description:mode==='local-demo'?'현재 실행에서 만든 합성 로그의 출력 회귀 검사':'제공된 로컬 실행 기록을 제한적으로 검토한 결과',targets:[result.label],vantage:'local-file',limitations:['실제 로그를 외부로 업로드하거나 원문·부분값·해시를 결과에 저장하지 않음.','정책의 업무적 타당성, 소스의 실제 실행 경로, 보관·접근 권한은 별도 검토 대상임.','다중 행·비지원 형식·중복 JSON 키·구조/크기 제한·읽지 않은 범위는 미확정임.','로그가 없다는 결과만으로 소스에서 출력이 제거되었다고 확정하지 않음.']},findings,coverage,sources:[]};
}
function cliArgs(argv){
  const args={format:'jsonl',label:'local-log'};
  for(let index=0;index<argv.length;index++){
    const option=argv[index];if(option==='--help')return {help:true};
    const map={'--rules':'rules','--input':'input','--format':'format','--label':'label','--out':'out'};
    if(!Object.hasOwn(map,option)||!argv[index+1]||argv[index+1].startsWith('--'))fail('INVALID_ARGUMENT','실행 인자 형식을 확인하세요.');
    const key=map[option];if(args['_'+key])fail('INVALID_ARGUMENT','실행 인자가 중복됩니다.');args[key]=argv[++index];args['_'+key]=true;
  }
  if(!args.rules||!args.input||!args.out)fail('INVALID_ARGUMENT','--rules, --input, --out을 지정하세요.');return args;
}
async function main(argv=process.argv.slice(2)){
  let output;
  try{
    const args=cliArgs(argv);
    if(args.help){process.stdout.write('사용법: node check-logs.cjs --rules field-policy.json --input 승인된로컬파일 --format jsonl|kv --label 안전한식별자 --out 새보고서.json\n입력 값·부분값·해시·원문 경로는 출력하지 않습니다.\n');return 0;}
    let policy;
    try{if(fs.statSync(args.rules).size>1048576)fail('RULES_SIZE','규칙 파일은 1 MiB 이하여야 합니다.');policy=JSON.parse(fs.readFileSync(args.rules,'utf8'));}catch(error){if(error instanceof AuditError)throw error;fail('RULES_READ','규칙 파일을 읽거나 해석하지 못했습니다. 내용은 출력하지 않습니다.');}
    validatePolicy(policy);
    try{output=fs.openSync(args.out,'wx',0o600);}catch{fail('OUTPUT_OPEN','새 보고서 파일을 만들지 못했습니다. 기존 파일을 덮어쓰지 않습니다.');}
    const result=await scanFile(args.input,policy,{format:args.format,label:args.label});
    const report=toReport(result);
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    process.stdout.write(JSON.stringify({physicalLines:result.summary.physicalLines,parsedLines:result.summary.parsedLines,unknownLines:result.summary.unknownLines,fullFile:result.summary.fileFullyRead,findings:report.findings.length})+'\n');return 0;
  }catch(error){const safe=error instanceof AuditError?error:new AuditError('AUDIT_ERROR','검토를 완료하지 못했습니다. 원문·경로·예외 값은 출력하지 않습니다.');process.stderr.write(JSON.stringify({error:safe.code,message:safe.message})+'\n');return 1;}
  finally{if(output!==undefined)try{fs.closeSync(output);}catch{}}
}
module.exports={validatePolicy,scanFile,toReport,DEFAULT_LIMITS,main};
if(require.main===module)main().then(code=>{process.exitCode=code;});
