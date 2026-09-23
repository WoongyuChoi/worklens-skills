// Executes the shipped JavaScript with an inert DOM adapter.
// This validates logic, not actual browser rendering, permissions or keyboard behavior.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),results=[];
function element(){
 const node={value:"",checked:false,disabled:false,hidden:false,className:"",children:[],attrs:{},listeners:{},_text:"",
 append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;this._text="";},
 setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.listeners[k]=v;},focus(){},select(){},
 showModal(){this.open=true;},close(){this.open=false;},click(){if(this.onclick)this.onclick();},
 querySelector(sel){this.queries??={};return this.queries[sel]??=(element());}};
 Object.defineProperty(node,"textContent",{get(){return String(this._text)+this.children.map(x=>x.textContent??x).join("");},set(v){this._text=String(v);this.children=[];}});
 return node;
}
function load(skill,file){
 const nodes={};const document={getElementById:id=>nodes[id]??=(element()),createElement:()=>element()};
 const html=fs.readFileSync(path.join(root,"skills",skill,"assets",file),"utf8");
 const context=vm.createContext({document,console,TextDecoder,Blob,URL,setTimeout,navigator:{},DOMParser:class{constructor(){throw Error("Browser-only XML parser not available in logic test");}}});
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],context);
 return {nodes,run:code=>vm.runInContext(code,context),context};
}
function check(name,fn){fn();results.push(name);}
function plain(value){return JSON.parse(JSON.stringify(value));}
const viewer=load("file-explorer","viewer.html");
viewer.nodes.delimiter.value="auto";viewer.nodes.header.value="yes";viewer.nodes.query.value="";
const parse=(text,name)=>viewer.run("parse("+JSON.stringify(text)+","+JSON.stringify(name)+")");
const rows=()=>plain(viewer.run("rows"));
check("CSV quoted delimiter, newline, escaped quotes",()=>{parse(fs.readFileSync(path.join(__dirname,"fixtures/sample.csv"),"utf8"),"sample.csv");assert.deepEqual(rows(),[["0012","담당자 A","쉼표, 포함"],["0013","담당자 B","두 줄\n설명"],["0014","담당자 C",'따옴표 "포함"']]);});
check("Headerless CSV preserves first record",()=>{viewer.nodes.header.value="no";parse("0012,A\n0013,B","input.csv");assert.equal(rows().length,2);assert.equal(rows()[0][0],"0012");viewer.nodes.header.value="yes";});
check("CSV duplicate headers retain independent columns",()=>{parse("a,a\n1,2","input.csv");assert.deepEqual(rows(),[["1","2"]]);assert.equal(new Set(plain(viewer.run("headers"))).size,2);});
check("TSV delimiter from extension",()=>{parse("a\tb\r\n0012\tx\r\n","input.tsv");assert.deepEqual(rows(),[["0012","x"]]);});
check("CSV empty fields retained",()=>{parse("a,b,c\n,0012,\n","input.csv");assert.deepEqual(rows(),[["","0012",""]]);});
check("CSV semicolon autodetection",()=>{parse("a;b\n1;2\n3;4","input.csv");assert.equal(rows().length,2);assert.equal(rows()[0][1],"2");});
check("Malformed CSV quote rejected",()=>assert.throws(()=>parse('a,b\n"oops',"input.csv"),/닫히지/));
check("Ragged CSV rejected",()=>assert.throws(()=>parse("a,b\n1,2,3","input.csv"),/열 수/));
check("CSV trailing junk after quote rejected",()=>assert.throws(()=>parse('a\n"x"z',"input.csv"),/따옴표 다음/));
check("Large JSON numbers and numeric format retained",()=>{parse(fs.readFileSync(path.join(__dirname,"fixtures/large-id.json"),"utf8"),"input.json");assert(rows()[0].includes('"900719925474099312345"'));assert(rows()[0].includes('"1.2300"'));assert(rows()[0].includes('"0012"'));});
check("JSON null and sentinel-like strings are distinct",()=>{parse('[{"x":null},{"x":"[null]"},{"x":"[필드 없음]"},{}]',"input.json");assert.equal(new Set(rows().map(r=>r[0])).size,4);});
check("JSON null, array, boolean and matching strings are distinct",()=>{parse('[{"x":null},{"x":[null]},{"x":"null"},{"x":"[null]"},{"x":false},{"x":"false"}]',"input.json");assert.equal(new Set(rows().map(r=>r[0])).size,6);});
check("JSON invalid numeric keys rejected",()=>assert.throws(()=>parse("{1:2}","input.json"),/JSON/));
check("JSON invalid leading-zero number rejected",()=>assert.throws(()=>parse('{"id":01}',"input.json"),/JSON/));
check("JSON empty objects remain visible",()=>{parse("[{},{}]","input.json");assert.deepEqual(rows(),[["{}"],["{}"]]);});
check("JSON nested values retain precision",()=>{parse('[{"nested":{"id":900719925474099312345}}]',"input.json");assert(rows()[0][0].includes("900719925474099312345"));});
check("Empty input rejected",()=>assert.throws(()=>parse(" \n ","input.txt"),/비어/));
check("Unsupported binary extension rejected",()=>assert.throws(()=>parse("data","input.xlsx"),/지원하지/));
check("XML DOCTYPE rejected before parsing",()=>assert.throws(()=>parse('<!DOCTYPE r><r/>',"input.xml"),/DOCTYPE/));
check("Record bound is explicit",()=>assert.throws(()=>parse("id\n"+Array.from({length:20001},(_,i)=>String(i)).join("\n"),"input.csv"),/20,000/));
check("Search and page count use all records",()=>{parse("id\n"+Array.from({length:205},(_,i)=>String(i)).join("\n"),"input.csv");assert.equal(viewer.nodes.table.querySelector("tbody").children.length,100);assert.equal(viewer.nodes.pageInfo.textContent,"1 / 3 페이지");viewer.nodes.query.value="204";viewer.run("filter()");assert.equal(viewer.nodes.matched.textContent,"1");});
check("Literal HTML input remains cell text",()=>{parse('value\n"<img src=x onerror=alert(1)>"',"input.csv");const td=viewer.nodes.table.querySelector("tbody").children[0].children[0];assert.equal(td.textContent,"<img src=x onerror=alert(1)>");assert.equal(td.children.length,0);});
const tool=load("task-to-tool","text-tool.html");
const transform=(text,opts)=>tool.run("transform("+JSON.stringify(text)+","+JSON.stringify(opts)+")");
check("Text identity preserves exact CRLF and whitespace",()=>assert.equal(transform(" 0012 \r\n\r\n0012 ",{trim:false,blank:false,dedupe:false})," 0012 \r\n\r\n0012 "));
check("Text options preserve codes and first occurrence order",()=>assert.equal(transform(" 0012 \n0013\n0012\n\n0014",{trim:true,blank:true,dedupe:true}),"0012\n0013\n0014"));
check("Text dedupe is case-sensitive",()=>assert.equal(transform("A\na\nA",{dedupe:true}),"A\na"));
check("Text empty input",()=>assert.equal(transform("",{trim:true,blank:true,dedupe:true}),""));
check("Changed input invalidates output",()=>{tool.nodes.input.value="0012";tool.nodes.run.onclick();assert.equal(tool.nodes.output.value,"0012");tool.nodes.input.oninput();assert.equal(tool.nodes.output.value,"");assert(tool.nodes.copy.disabled);});
const ui=load("screen-prototype","prototype.html");
check("Prototype initial counters",()=>assert.equal(ui.nodes.total.textContent,"3"));
check("Prototype empty fields prevent save",()=>{ui.nodes.add.onclick();ui.nodes.form.onsubmit({preventDefault(){}});assert(ui.nodes.error.textContent.includes("모두 입력"));assert.equal(ui.nodes.total.textContent,"3");});
check("Prototype valid create updates counters",()=>{ui.nodes.title.value="새 업무";ui.nodes.owner.value="검증 담당";ui.nodes.status.value="완료";ui.nodes.form.onsubmit({preventDefault(){}});assert.equal(ui.nodes.total.textContent,"4");assert.equal(ui.nodes.done.textContent,"2");});
check("Prototype duplicate name rejected",()=>{ui.nodes.add.onclick();ui.nodes.title.value="새 업무";ui.nodes.owner.value="다른 담당";ui.nodes.form.onsubmit({preventDefault(){}});assert(ui.nodes.error.textContent.includes("같은 이름"));assert.equal(ui.nodes.total.textContent,"4");});
check("Prototype combined filtering and reset",()=>{ui.nodes.search.value="업로드";ui.nodes.filter.value="완료";ui.run("render()");assert(!ui.nodes.empty.hidden);ui.nodes.reset.onclick();assert.equal(ui.nodes.total.textContent,"3");assert.equal(ui.nodes.rows.children.length,3);});
fs.mkdirSync(path.join(root,"test-results"),{recursive:true});
fs.writeFileSync(path.join(root,"test-results/logic-results.json"),JSON.stringify({scope:"Node VM logic only; not browser execution",count:results.length,passed:results},null,2)+"\n");
console.log("PASS: "+results.length+" JavaScript logic checks (not browser execution)\n"+results.map(x=>"  "+x).join("\n"));
