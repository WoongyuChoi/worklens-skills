// Development check only. Skill users do not need Node.js.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),base=path.join(root,"skills");
const names=fs.readdirSync(base).filter(n=>fs.statSync(path.join(base,n)).isDirectory());
assert.equal(names.length,10,"Expected ten initial skills");
let assets=0;
for(const name of names){
 const dir=path.join(base,name),content=fs.readFileSync(path.join(dir,"SKILL.md"),"utf8");
 const match=content.match(/^---\nname: ([a-z0-9-]+)\ndescription: ("[^\n]*")\n---\n/);
 assert(match,"Invalid frontmatter: "+name);assert.equal(match[1],name);JSON.parse(match[2]);
 assert(content.includes("## Working contract"));assert(content.includes("Korean"));assert(content.includes("offline"));
 assert(content.split("\n").length<500);assert(!/\bTODO\b|\[TODO/.test(content));
 assert(!/[\u3040-\u30ff\u4e00-\u9fff]/.test(content),"Unexpected Japanese/Han characters: "+name);
 for(const m of content.matchAll(/(?:assets|references)\/[a-z0-9-]+\.(?:md|html)/g))assert(fs.existsSync(path.join(dir,m[0])),"Missing resource: "+name+"/"+m[0]);
 const assetDir=path.join(dir,"assets");
 if(!fs.existsSync(assetDir))continue;
 for(const file of fs.readdirSync(assetDir).filter(n=>n.endsWith(".html"))){
  assets++;const html=fs.readFileSync(path.join(assetDir,file),"utf8");
  assert(html.includes('lang="ko"'));assert(html.includes("connect-src 'none'"));
  assert(!/<script[^>]+src=|<link[^>]+href=|@import|fetch\s*\(|XMLHttpRequest|WebSocket|innerHTML\s*=|eval\s*\(/i.test(html),"Unexpected external dependency or unsafe sink: "+file);
  for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:file});
 }
}
console.log("PASS: "+names.length+" skill structures, linked resources, "+assets+" offline HTML assets and JavaScript syntax");
