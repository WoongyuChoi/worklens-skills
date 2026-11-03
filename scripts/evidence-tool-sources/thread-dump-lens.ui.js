function render(result){
 finish(result,result.snapshots.length+'개 덤프 · 반복 스택 '+result.persistent.length+'개 · 모니터 순환 후보 '+result.snapshots.reduce((n,s)=>n+s.monitorCycles.length,0)+'개');
 table('시점별 상태',['소스','스레드 수','상태','모니터 순환','소유자 미확인'],result.snapshots.map(s=>[s.name,s.threadCount,JSON.stringify(s.states),s.monitorCycles.length,s.unknownOwners.length]));
 for(const s of result.snapshots){
  table(s.name+' · 모니터 대기 관계',['대기자 / 근거 줄','소유자 / 근거 줄','모니터'],s.monitorEdges.map(e=>[s.threads[e.from].name+' / '+e.line,s.threads[e.to].name+' / '+s.threads[e.to].line,e.lock]));
  if(s.monitorCycles.length)note(s.name+' 순환 후보: '+s.monitorCycles.map(c=>c.threads.map(i=>s.threads[i].name).join(' → ')).join('; ')+' · 원본 소유/대기 행과 JVM 진단을 함께 확인하세요.');
  table(s.name+' · 스레드 (앞 500개)',['이름 / ID','상태','소스 줄','첫 프레임'],s.threads.slice(0,500).map(t=>[t.name+' / '+(t.identity||'미확인'),t.state,t.line,t.frames[0]||'프레임 없음']));
 }
 table('모든 입력에서 동일하게 보이는 스택',['스레드','상태','근거','첫 프레임'],result.persistent.map(t=>[t.name,t.state,t.sources.map(s=>s.snapshot+':'+s.line).join(', '),t.frames[0]]));
}
$('run').addEventListener('click',async()=>{
 clear();const token=revision;try{
  let snapshots=[];const files=Array.from($('files').files);
  if(files.length){if(files.length>5)throw new Error('파일은 최대 5개입니다.');for(const file of files){if(file.size>2*1024*1024)throw new Error('파일 하나는 최대 2 MiB입니다.');const text=await readUtf8(file);snapshots.push({name:file.name,text});}}
  else{if($('input1').value.trim())snapshots.push({name:'snapshot-1',text:$('input1').value});if($('input2').value.trim())snapshots.push({name:'snapshot-2',text:$('input2').value});}
  if(token!==revision)return;render(WorklensTool.run({snapshots}));
 }catch(error){if(token===revision)status(error.message,true);}
});
$('sample').addEventListener('click',()=>{
 clear();$('files').value='';
 $('input1').value='"worker-A" #11 tid=0x001 nid=0x101 waiting for monitor entry\n   java.lang.Thread.State: BLOCKED (on object monitor)\n\tat demo.Transfer.run(Transfer.java:41)\n\t- waiting to lock <0xbbb> (a java.lang.Object)\n\t- locked <0xaaa> (a java.lang.Object)\n\n"worker-B" #12 tid=0x002 nid=0x102 waiting for monitor entry\n   java.lang.Thread.State: BLOCKED (on object monitor)\n\tat demo.Transfer.run(Transfer.java:59)\n\t- waiting to lock <0xaaa> (a java.lang.Object)\n\t- locked <0xbbb> (a java.lang.Object)\n\n"idle-pool" #13 tid=0x003 nid=0x103 waiting on condition\n   java.lang.Thread.State: WAITING (parking)\n\tat java.util.concurrent.locks.LockSupport.park(LockSupport.java:211)\n\t- parking to wait for <0xccc> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)';
 $('input2').value=$('input1').value;status('합성 교착 후보와 정상일 수 있는 풀 대기를 함께 넣었습니다. 실제 덤프가 아닙니다.');
});
