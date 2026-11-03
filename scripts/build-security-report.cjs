'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(__dirname,'security-tool-sources');
const core=fs.readFileSync(path.join(source,'report-core.cjs'),'utf8');
const html=fs.readFileSync(path.join(source,'report.html'),'utf8').replace('__CORE__',()=>core);
for(const name of ['api-authz-probe','source-sink-review','dependency-advisory-triage','agent-boundary-check','privacy-log-audit']){
 const skill=path.join(root,'skills',name);fs.writeFileSync(path.join(skill,'assets/report.html'),html);for(const file of ['report-core.cjs','render-report.cjs'])fs.copyFileSync(path.join(source,file),path.join(skill,'scripts',file));
}
console.log('Built five portable security report viewers and renderers.');
