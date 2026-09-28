const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const names=['data-reconcile','config-compare','variance-bridge','pairwise-cases','sample-mask'];
const api=Object.fromEntries(names.map(n=>[n,require(path.join(root,'skills',n,'scripts/tool.cjs'))]));
const reconcile=q=>api['data-reconcile'].run({keys:['id'],...q});
test('CSV comparison ignores record order and retains zero-prefixed identifiers',()=>{
 const r=reconcile({left:'id,v\n001,A\n002,B',right:'id,v\n002,B\n001,A'});assert.equal(r.counts.matched,2);assert.equal(r.rows.length,0);
});
test('Composite keys are collision-safe even with delimiter-like input',()=>{
 const r=reconcile({left:'a,b,v\n"x,y",z,1\nx,"y,z",2',right:'a,b,v\nx,"y,z",3\n"x,y",z,1',keys:['a','b']});assert.equal(r.counts.matched,1);assert.equal(r.counts.changed,1);
});
test('Duplicate and blank keys are kept out of matches',()=>{
 const r=reconcile({left:'id,v\nx,1\nx,2\n,3',right:'id,v\nx,1\ny,4'});assert.equal(r.counts.duplicateKeys,1);assert.equal(r.counts.invalidRows,1);assert.equal(r.counts.rightOnly,1);assert.equal(r.counts.matched,0);
});
test('Quoted newlines, escaped quotes and differing cells remain intact',()=>{
 const r=reconcile({left:'id,v\n1,"a\nb,\"\"x\"\""',right:'id,v\n1,"a\nb,\"\"y\"\""'});assert.equal(r.counts.changed,1);assert(r.rows[0][3].includes('\\n'));
});
test('Invalid CSV and duplicate headers fail explicitly',()=>{
 for(const text of ['id,id\n1,2','id,v\n1','id,v\n1,"bad','id,v\n1,"a"junk','id,\n1,2'])assert.throws(()=>reconcile({left:text,right:text}));
});
test('Lossless JSON retains large integers and distinguishes number from string',()=>{
 const r=reconcile({format:'json',left:'[{"id":9007199254740993,"v":1},{"id":"9007199254740993","v":2}]',right:'[{"v":3,"id":"9007199254740993"},{"v":1,"id":9007199254740993}]'});assert.equal(r.counts.matched,1);assert.equal(r.counts.changed,1);assert(r.rows[0][1].includes('9007199254740993'));
});
test('JSON null, missing and lookalike strings cannot collapse',()=>{
 const r=reconcile({format:'json',left:'[{"id":"a","v":null},{"id":"b","v":"[필드 없음]"}]',right:'[{"id":"a","v":"null"},{"id":"b"}]'});assert.equal(r.counts.changed,2);assert.notEqual(r.rows[1][3],r.rows[1][4]);
});
test('Nested object order is irrelevant but arrays and number lexemes remain exact',()=>{
 const r=reconcile({format:'json',left:'[{"id":"a","v":{"a":1,"b":[2,3]}},{"id":"b","v":1}]',right:'[{"id":"a","v":{"b":[2,3],"a":1}},{"id":"b","v":1.0}]'});assert.equal(r.counts.matched,1);assert.equal(r.counts.changed,1);
});
test('Malformed JSON and duplicate object keys are rejected',()=>{
 for(const text of ['[{"id":1,"id":2}]','[{"id":01}]','[{"id":1,}]','[{"id":NaN}]','[{"id":1}]x','[{"id":1,"v":"bad\ntext"}]'])assert.throws(()=>reconcile({format:'json',left:text,right:text}));
});
test('Schema differences are visible for header-only files',()=>{
 const r=reconcile({left:'id,a',right:'id,b'});assert.deepEqual(r.schema,{leftOnly:['a'],rightOnly:['b']});assert.equal(r.leftRows,0);
});
test('Empty JSON extract uses the other side schema; two empty extracts remain unresolved',()=>{
 const q={format:'json',left:'[]',right:'[{"id":"001","v":"x"}]'};assert.equal(reconcile(q).counts.rightOnly,1);assert.equal(reconcile({...q,left:q.right,right:q.left}).counts.leftOnly,1);assert.throws(()=>reconcile({format:'json',left:'[]',right:'[]'}),/키 구조/);
});
test('TSV, semicolon CSV, row limits and byte limits are explicit',()=>{
 assert.equal(reconcile({format:'tsv',left:'id\tv\n1\tx',right:'id\tv\n1\tx'}).counts.matched,1);
 assert.equal(reconcile({delimiter:';',left:'id;v\n1;x',right:'id;v\n1;x'}).counts.matched,1);
 assert.throws(()=>reconcile({left:'id\n'+Array.from({length:10001},(_,i)=>i).join('\n'),right:'id'}));
 assert.throws(()=>reconcile({left:'가'.repeat(800000),right:'id'}));
});
test('CSV exports escape formulas while JSON values stay exact',()=>{
 const r=api['variance-bridge'].run({left:'k,v\n=evil,1',right:'k,v\n=evil,2',key:'k',value:'v'});assert.equal(r.rows[0][0],'=evil');assert(r.csv.includes("'=evil"));assert(api['sample-mask'].csvExport(['x'],[[' \t=evil']]).includes("' \t=evil"));
});
test('Configuration values are hidden by default including unknown credential names',()=>{
 const r=api['config-compare'].run({left:'{"odd":"topsecret1","password":"topsecret2"}',right:'{"odd":"topsecret3","password":"topsecret4"}'});const s=JSON.stringify(r);assert(!s.includes('topsecret'));assert.equal(r.rows.length,2);
});
test('Public-key allowlist works while sensitive keys remain masked',()=>{
 const r=api['config-compare'].run({left:'{"timeout":30,"password":"hiddenA"}',right:'{"timeout":60,"password":"hiddenB"}',publicKeys:['/timeout','/password']});assert.equal(r.rows.find(x=>x[1]==='/timeout')[2],'30');assert(!JSON.stringify(r).includes('hidden'));
});
test('Config paths distinguish slash-containing keys, arrays and unresolved variables',()=>{
 const r=api['config-compare'].run({left:'{"a/b":"${HOST}","list":[1,2]}',right:'{"list":[2,1],"a/b":"${HOST}"}'});assert(r.rows.some(x=>x[0]==='변수 미해결'&&x[1]==='/a~1b'));assert.equal(r.rows.filter(x=>x[0]==='값 다름').length,2);
});
test('Simple properties preserve trailing spaces and reject unsupported semantics',()=>{
 const run=q=>api['config-compare'].run({format:'properties',...q});assert.equal(run({left:'a=1\n# ignored',right:'a=1 '}).rows.length,1);
 for(const text of ['a=1\na=2','a=abc\\\ndef','a=\\uAC00','white space value'])assert.throws(()=>run({left:text,right:text}));
});
test('Configuration structural changes are not mistaken for equal leaves',()=>{
 const r=api['config-compare'].run({left:'{"a":{},"b":{"c":1}}',right:'{"a":[],"b":1}'});assert(r.rows.some(x=>x[0]==='구조 다름'&&x[1]==='/a'));assert(r.rows.some(x=>x[0]==='구조 다름'&&x[1]==='/b'));
});
test('Properties enforce 10,000 physical lines with optional final newline',()=>{
 const text=Array.from({length:10000},(_,i)=>'k'+i+'=v').join('\n');assert.equal(api['config-compare'].run({format:'properties',left:text+'\n',right:text}).rows.length,0);assert.throws(()=>api['config-compare'].run({format:'properties',left:text+'\nx=v',right:text}));
});
test('Variance bridge computes large decimal amounts exactly',()=>{
 const r=api['variance-bridge'].run({left:'k,v\na,9007199254740993.10\nb,0.20',right:'k,v\na,9007199254740993.20\nb,0.30',key:'k',value:'v'});assert.deepEqual(r.totals,{start:'9007199254740993.30',delta:'0.20',end:'9007199254740993.50'});
});
test('Variance shows new and removed categories and offsetting contributions',()=>{
 const r=api['variance-bridge'].run({left:'k,v\na,20\nb,-5',right:'k,v\na,10\nc,5',key:'k',value:'v'});assert.equal(r.totals.delta,'0');assert(r.rows.some(x=>x[4]==='신규 항목'));assert(r.rows.some(x=>x[4]==='제외 항목'));
});
test('Variance rejects duplicates, blanks, exponents and nonnumeric values',()=>{
 for(const left of ['k,v\na,1\na,2','k,v\na,','k,v\na,1e3','k,v\na,NaN','k,v\n,1'])assert.throws(()=>api['variance-bridge'].run({left,right:'k,v\na,1',key:'k',value:'v'}));
});
// Independent exhaustive oracle, separate from the implementation's pair-key algorithm.
function assertPairs(q,r){
 const names=Object.keys(q.factors),all=[];let states=[{}];for(const name of names)states=states.flatMap(s=>q.factors[name].map(v=>({...s,[name]:v})));
 for(const s of states)if(!(q.excludes||[]).some(e=>Object.entries(e).every(([k,v])=>s[k]===v)))all.push(s);
 const picked=r.rows.map(row=>Object.fromEntries(names.map((n,i)=>[n,row[i+1]])));assert(picked.every(p=>all.some(a=>names.every(n=>a[n]===p[n]))));
 let count=0;for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)for(const x of q.factors[names[i]])for(const y of q.factors[names[j]])if(all.some(s=>s[names[i]]===x&&s[names[j]]===y)){count++;assert(picked.some(s=>s[names[i]]===x&&s[names[j]]===y));}
 assert.equal(r.coverage.covered,count);assert.equal(r.coverage.valid,all.length);for(const m of q.mandatory||[])assert(picked.some(p=>names.every(n=>p[n]===m[n])));
}
test('Pairwise output covers constrained valid pairs and preserves mandatory cases',()=>{
 const q={factors:{role:['a','b','c'],status:['new','done'],input:['full','empty']},excludes:[{role:'a',status:'done'}],mandatory:[{role:'b',status:'done',input:'empty'}]};const r=api['pairwise-cases'].run(q);assertPairs(q,r);assert(r.coverage.selected<r.coverage.valid);assert.deepEqual(r,api['pairwise-cases'].run(q));
});
test('Pairwise coverage agrees with an exhaustive oracle across 20 small models',()=>{
 for(let i=0;i<20;i++){const q={factors:{a:['0','1','2'],b:['0','1'],c:['x','y'],d:['s','t']},excludes:[{a:String(i%3),b:String(i%2)},{c:i%2?'x':'y',d:i%3?'s':'t'}]};assertPairs(q,api['pairwise-cases'].run(q));}
});
test('Pairwise exposes impossible values and rejects invalid constraints and excess size',()=>{
 const q={factors:{a:['0','1'],b:['x','y']},excludes:[{a:'1'}]};assert.deepEqual(api['pairwise-cases'].run(q).excludedValues,[{factor:'a',value:'1'}]);
 for(const bad of [{factors:{a:['0'],b:['x']},excludes:[{}]},{factors:{a:['0','0'],b:['x']}},{factors:{a:['0'],b:['x']},excludes:[{a:'0'}]},{factors:{a:['0'],b:['x']},mandatory:[{a:'0'}]},{factors:Object.fromEntries('abcdefgh'.split('').map(k=>[k,['0','1','2','3']]))}])assert.throws(()=>api['pairwise-cases'].run(bad));
});
test('Masking preserves repeated links without exporting raw values or reverse maps',()=>{
 const r=api['sample-mask'].run({text:'고객A a@example.com\n고객A a@example.com',literals:['고객A']});assert.equal(r.distinct,2);assert.equal(r.occurrences,4);assert.equal(r.text.split('\n')[0],r.text.split('\n')[1]);assert(!JSON.stringify(r).includes('a@example.com'));assert(!JSON.stringify(r).includes('고객A'));
});
test('Masking handles overlaps, token collisions and disabled patterns explicitly',()=>{
 const r=api['sample-mask'].run({text:'[가림_1] abcdef abc a@example.com',literals:['abc','abcdef'],patterns:false});assert(r.text.includes('[가림_1]'));assert(r.text.includes('[가림1_1]'));assert(r.text.includes('a@example.com'));assert.equal(r.occurrences,2);
});
test('Masking detects Korean identifier-shaped text and keeps markup inert as text',()=>{
 const r=api['sample-mask'].run({text:'<script>alert(1)</script> 010-1234-5678 900101-1234567'});assert.equal(r.occurrences,2);assert(r.text.startsWith('<script>'));assert(!r.text.includes('010-1234-5678'));
});
test('Masking large non-email runs and token-like prefixes stays bounded',()=>{
 const script=path.join(root,'skills/sample-mask/scripts/tool.cjs');const p=spawnSync(process.execPath,['-e',`const {run}=require(process.argv[1]);for(const text of ['a'.repeat(1000000),'['.repeat(1000000)+'가림_','. '.repeat(400000)]){if(run({text}).text!==text)throw Error('unexpected change')}` ,script],{timeout:5000,encoding:'utf8'});assert.equal(p.status,0,p.error?.message||p.stderr);
});
test('All 5 browser engines produce the same results as their CLI module',()=>{
 for(const name of names){const html=fs.readFileSync(path.join(root,'skills',name,'assets/tool.html'),'utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(code);const core=code.slice(0,code.indexOf('const $=id=>'));const context=vm.createContext({TextEncoder});vm.runInContext(core+'\nglobalThis.run=Worklens.run;',context);const sample=JSON.parse(fs.readFileSync(path.join(root,'skills',name,'assets/example-request.json')));assert.equal(JSON.stringify(context.run(sample)),JSON.stringify(api[name].run(sample)));}
});
test('CLI creates a new result, fails on malformed input and never overwrites an existing file',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-test-'));try{const source=path.join(dir,'request.json'),out=path.join(dir,'result.json'),script=path.join(root,'skills/variance-bridge/scripts/tool.cjs');fs.writeFileSync(source,JSON.stringify({left:'k,v\na,1',right:'k,v\na,2',key:'k',value:'v'}));let p=spawnSync(process.execPath,[script,source,out],{encoding:'utf8'});assert.equal(p.status,0);assert.equal(JSON.parse(fs.readFileSync(out)).totals.delta,'1');const before=fs.readFileSync(out,'utf8');p=spawnSync(process.execPath,[script,source,out],{encoding:'utf8'});assert.equal(p.status,1);assert.equal(fs.readFileSync(out,'utf8'),before);fs.writeFileSync(source,'invalid');p=spawnSync(process.execPath,[script,source,path.join(dir,'bad.json')],{encoding:'utf8'});assert.equal(p.status,1);assert(!fs.existsSync(path.join(dir,'bad.json')));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('CLI rejects malformed UTF-8 without creating a corrupted result',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-utf8-'));try{const input=path.join(dir,'request.json'),out=path.join(dir,'result.json');fs.writeFileSync(input,Buffer.concat([Buffer.from('{"text":"before'),Buffer.from([255]),Buffer.from('after","patterns":false}')]));const p=spawnSync(process.execPath,[path.join(root,'skills/sample-mask/scripts/tool.cjs'),input,out],{encoding:'utf8'});assert.equal(p.status,1);assert(!fs.existsSync(out));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
