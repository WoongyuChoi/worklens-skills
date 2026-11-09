'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(__dirname,'security-tool-sources');
const original=['api-authz-probe','source-sink-review','dependency-advisory-triage','agent-boundary-check','privacy-log-audit'];
const added=['session-lifecycle-check','workflow-abuse-test','upload-lifecycle-test','browser-origin-check','deployment-exposure-audit'];
for(const name of original){
 const skill=path.join(root,'skills',name);
 for(const file of ['report-core.cjs','write-report.cjs'])fs.copyFileSync(path.join(source,file),path.join(skill,'scripts',file));
 for(const file of ['assets/report.html','scripts/render-report.cjs'])fs.rmSync(path.join(skill,file),{force:true});
}
for(const name of [...original,...added])fs.copyFileSync(path.join(source,'report-blueprint.md'),path.join(root,'skills',name,'references/report-blueprint.md'));
console.log('Built Markdown writers for five existing skills and report blueprints for ten security skills.');
