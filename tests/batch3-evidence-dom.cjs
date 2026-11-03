// Development-only minimum DOM adapter. Does not verify a real browser or layout.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let checks=0;
function load(name){
 const html=fs.readFileSync(path.join(root,'skills',name,'assets/tool.html'),'utf8'),ids=new Map(),blobs=[];
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this._text='';this._value='';this.disabled=false;this.files=[];this.type='';this.className='';}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
  set value(v){this._value=String(v);if(this.type==='file'&&v==='')this.files=[];}get value(){return this._value;}
  append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this._text='';this.children=nodes;}
  addEventListener(event,fn){(this.listeners[event]||=[]).push(fn);}async fire(event){for(const fn of this.listeners[event]||[])await fn();}async click(){if(!this.disabled)await this.fire('click');}
 }
 for(const match of html.matchAll(/<([a-z0-9-]+)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){const e=new Element(match[1]);e.disabled=/\bdisabled\b/.test(match[2]);e.type=(match[2].match(/type="([^"]+)"/)||[])[1]||'';ids.set(match[3],e);}
 const document={getElementById:id=>ids.get(id)||null,createElement:tag=>new Element(tag),querySelectorAll:selector=>[...ids.values()].filter(e=>selector.split(',').includes(e.tagName.toLowerCase()))};
 const sandbox={document,TextEncoder,TextDecoder,Uint8Array,Blob,URL:{createObjectURL(blob){blobs.push(blob);return 'blob:local-test';},revokeObjectURL(){}},setTimeout:fn=>fn()};
 const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInNewContext(script,sandbox,{filename:name+'.html',timeout:1000});
 const $=id=>ids.get(id),click=async id=>$(id).click(),result=()=>JSON.parse($('raw').textContent);
 return {$,click,result,blobs,html};
}
const file=(name,bytes)=>({name,size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
(async()=>{
 const e=load('encoding-boundary');await e.click('sample');await e.click('run');assert.equal(e.result().inputByteLength,11);assert.equal(e.result().truncation.safeUtf8Text,'가A');checks++;
 const markup='<img src=x onerror="globalThis.bad=1">0012';e.$('input').value=markup;await e.$('input').fire('input');assert(e.$('download').disabled);assert.equal(e.$('raw').textContent,'');await e.click('run');assert.equal(e.result().decodedText,markup);checks++;
 await e.click('download');assert.equal(JSON.parse(await e.blobs.at(-1).text()).decodedText,markup);checks++;
 e.$('mode').value='hex';e.$('input').value='EA B0';await e.click('run');assert.equal(e.result().decodeValid,false);checks++;
 e.$('input').value='xyz';await e.click('run');assert(e.$('status').className.includes('error'));assert(e.$('download').disabled);assert.equal(e.$('results').children.length,0);checks++;
 e.$('mode').value='file';e.$('charset').value='utf-8';e.$('file').files=[file('raw.dat',[239,187,191,65])];await e.click('run');assert.equal(e.result().bom.name,'UTF-8');assert.equal(e.result().decodedText,'\uFEFFA');checks++;
 e.$('file').files=[{name:'large.dat',size:131073}];await e.click('run');assert(e.$('status').textContent.includes('128 KiB'));checks++;
 const t=load('thread-dump-lens');await t.click('sample');await t.click('run');assert.equal(t.result().snapshots.length,2);assert.equal(t.result().snapshots[0].monitorCycles.length,1);assert.equal(t.result().snapshots[0].states.WAITING,1);checks++;
 const badName='idle-<img src=x onerror=1>';t.$('input1').value=t.$('input1').value.replace('idle-pool',badName);await t.click('run');assert(t.$('results').textContent.includes(badName));checks++;
 t.$('files').files=[file('broken.txt',[255])];await t.click('run');assert(t.$('status').textContent.includes('UTF-8'));assert(t.$('download').disabled);checks++;
 t.$('files').files=[];t.$('input1').value='{"threads":[]}';t.$('input2').value='';await t.click('run');assert(t.$('status').textContent.includes('플랫폼'));assert.equal(t.$('raw').textContent,'');checks++;
 const i=load('incident-evidence');await i.click('sample');await i.click('run');assert.equal(i.result().parsedCount,3);assert.equal(i.result().unresolved.length,1);assert.equal(i.result().events[1].lineEnd,3);checks++;
 i.$('query').value='0012';await i.$('query').fire('input');assert(i.$('download').disabled);await i.click('run');assert.equal(i.result().events.length,2);assert.equal(i.result().unresolved.length,1);checks++;
 i.$('offset').value='540';await i.click('run');assert.equal(i.result().parsedCount,4);assert.equal(i.result().events.length,3);assert.equal(i.result().unresolved.length,0);checks++;
 await i.click('csv');const csv=await i.blobs.at(-1).text();assert(csv.includes('0012'));assert(csv.includes('"UTC"'));checks++;
 i.$('files').files=[file('=source.log',Buffer.from('2026-11-03T00:00:10Z 0012'))];await i.click('run');assert.equal(i.result().sourceCount,2);await i.click('csv');assert((await i.blobs.at(-1).text()).includes('"\'=source.log"'));checks++;
 i.$('files').files=[file('invalid.log',[192,128])];await i.click('run');assert(i.$('status').textContent.includes('UTF-8'));assert(i.$('csv').disabled);checks++;
 i.$('files').files=[];i.$('input').value='2026-11-03T00:00:00Z <script>bad()</script>';i.$('query').value='';await i.click('run');assert(i.$('results').textContent.includes('<script>bad()</script>'));checks++;
 for(const name of ['encoding-boundary','thread-dump-lens','incident-evidence']){const {html}=load(name);const core=fs.readFileSync(path.join(root,'skills',name,'scripts/tool.cjs'),'utf8');assert(html.includes(core));const context={TextEncoder,TextDecoder,Uint8Array};vm.createContext(context);vm.runInContext(core,context);const request=JSON.parse(fs.readFileSync(path.join(root,'skills',name,'assets/example-request.json'),'utf8'));const expected=require(path.join(root,'skills',name,'scripts/tool.cjs')).run(request);assert.equal(JSON.stringify(context.WorklensTool.run(request)),JSON.stringify(expected));checks++;}
 console.log('PASS '+checks+' inline-script/DOM/CLI parity checks. No real browser/rendering verification.');
})().catch(error=>{console.error(error);process.exitCode=1;});
