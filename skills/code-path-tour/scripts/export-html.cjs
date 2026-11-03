// Optional existing-Node path; browser users do not need this script.
'use strict';
const fs=require('node:fs'),path=require('node:path'),tool=require('./tool.cjs');
try{
 if(process.argv.length!==4)throw new Error('사용법: node export-html.cjs 안내.json 새안내.html');
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(process.argv[2]));
 const tour=tool.run(raw).tour;
 const template=fs.readFileSync(path.join(__dirname,'../assets/tool.html'),'utf8');
 fs.writeFileSync(process.argv[3],tool.exportHTML(template,tour),{flag:'wx'});
}catch(error){console.error(error.message);process.exitCode=1;}
