const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
for(const name of ['encoding-boundary','thread-dump-lens','incident-evidence','schedule-lens','code-path-tour'])test(name+': optional CLI accepts file paths, preserves output, rejects invalid UTF-8',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-cli-'));
 try{
  const skill=path.join(root,'skills',name),input=path.join(temp,'request.json'),output=path.join(temp,'result.json'),cli=path.join(skill,'scripts/tool.cjs');
  fs.copyFileSync(path.join(skill,'assets',name==='code-path-tour'?'example-tour.json':'example-request.json'),input);
  const r=spawnSync(process.execPath,[cli,input,output]);assert.equal(r.status,0,r.stderr.toString());const bytes=fs.readFileSync(output);JSON.parse(bytes.toString());
  assert.notEqual(spawnSync(process.execPath,[cli,input,output]).status,0);assert.deepEqual(fs.readFileSync(output),bytes);
  fs.writeFileSync(input,Buffer.from([123,34,116,101,120,116,34,58,34,255,34,125]));const bad=path.join(temp,'bad.json');assert.notEqual(spawnSync(process.execPath,[cli,input,bad]).status,0);assert.equal(fs.existsSync(bad),false);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('code tour export CLI creates a populated independent HTML and rejects overwriting',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-tour-'));
 try{
  const dir=path.join(root,'skills/code-path-tour'),input=path.join(dir,'assets/example-tour.json'),output=path.join(temp,'tour.html'),cli=path.join(dir,'scripts/export-html.cjs'),tool=require(path.join(dir,'scripts/tool.cjs'));
  const run=spawnSync(process.execPath,[cli,input,output]);assert.equal(run.status,0,run.stderr.toString());const html=fs.readFileSync(output,'utf8');
  const raw=html.match(/<script type="application\/json" id="embedded-tour">([\s\S]*?)<\/script>/)[1];assert.deepEqual(tool.readEmbedded(raw).tour,tool.run(fs.readFileSync(input,'utf8')).tour);
  assert.notEqual(spawnSync(process.execPath,[cli,input,output]).status,0);assert.equal(fs.readFileSync(output,'utf8'),html);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
