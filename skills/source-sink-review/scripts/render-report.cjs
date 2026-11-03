#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {normalizeBundle,safeJSON}=require('./report-core.cjs');
function render(raw){const reports=normalizeBundle(raw),template=fs.readFileSync(path.join(__dirname,'../assets/report.html'),'utf8');const marker='/*__REPORT_DATA__*/null';if(!template.includes(marker))throw Error('보고서 템플릿이 올바르지 않습니다.');return template.replace(marker,()=>safeJSON(reports));}
if(require.main===module){try{const args=process.argv.slice(2);if(args.length!==2)throw Error('사용법: node scripts/render-report.cjs report.json new-report.html');if(fs.statSync(args[0]).size>4*1024*1024)throw Error('입력은 4MB 이하여야 합니다.');if(path.resolve(args[0])===path.resolve(args[1]))throw Error('입력 파일을 덮어쓸 수 없습니다.');let raw;try{raw=JSON.parse(fs.readFileSync(args[0],'utf8'));}catch{throw Error('보고서 JSON을 읽거나 해석하지 못했습니다. 입력 내용은 출력하지 않습니다.');}fs.writeFileSync(args[1],render(raw),{flag:'wx'});console.log('단일 HTML 보고서를 저장했습니다.');}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={render};
