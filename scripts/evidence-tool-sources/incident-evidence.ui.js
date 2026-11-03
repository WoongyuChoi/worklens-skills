function render(result){
 finish(result,'시간 확인 '+result.parsedCount+'건 · 현재 표시 '+result.events.length+'건 · 시간 미해결 '+result.unresolved.length+'건 · 미연결 원문 '+result.untimed.length+'건');
 table('시간표 (앞 1000개, 전체는 JSON/CSV)',['UTC','원래 시각 / 시간 근거','소스 / 줄','원문'],result.events.slice(0,1000).map(e=>[e.utc,e.originalTimestamp+' / '+e.timeBasis,e.source+':'+e.lineStart+'–'+e.lineEnd,e.raw]));
 table('시간 미해결 (앞 500개)',['소스 / 줄','이유','원문'],result.unresolved.slice(0,500).map(e=>[e.source+':'+e.lineStart,e.unresolvedReason,e.raw]));
 table('시간 미연결 원문 (앞 500개)',['소스 / 줄','이유','원문'],result.untimed.slice(0,500).map(e=>[e.source+':'+e.lineStart,e.reason,e.raw]));
 if(result.sameTimestamp.length)note('같은 타임스탬프 '+result.sameTimestamp.length+'구간이 있습니다. 같은 시각 안의 표시 순서는 인과 순서가 아닙니다.');
}
$('run').addEventListener('click',async()=>{
 clear();const token=revision;try{
  const offsetMinutes=$('offset').value===''?null:Number($('offset').value),sources=[],files=Array.from($('files').files);
  if($('input').value.trim())sources.push({name:'pasted-log',text:$('input').value,offsetMinutes});
  if(files.length+sources.length>8)throw new Error('입력 소스는 최대 8개입니다.');let bytes=0;
  for(const file of files){bytes+=file.size;if(bytes>2*1024*1024)throw new Error('파일 합계는 최대 2 MiB입니다.');sources.push({name:file.name,text:await readUtf8(file),offsetMinutes});}
  if(token!==revision)return;render(WorklensTool.run({sources,query:$('query').value}));
 }catch(error){if(token===revision)status(error.message,true);}
});
$('sample').addEventListener('click',()=>{clear();$('files').value='';$('offset').value='';$('query').value='';$('input').value='2026-11-03T09:00:00+09:00 request=0012 조회 시작\n2026-11-03T00:00:02Z request=0012 timeout\n  at demo.Client.read(Client.java:52)\n2026-11-03 09:00:03 request=0012 재시도 기록 (시간대 미확인)\n2026-11-03T09:00:05+09:00 operator-note 설정 확인, 복구 성공 여부 미확인';status('합성 예제입니다. 시간대 없는 행과 복구 미확인 조치가 포함되어 있습니다.');});
$('csv').addEventListener('click',()=>{if(current)save(WorklensTool.csv(current),'incident-timeline.csv','text/csv');});
