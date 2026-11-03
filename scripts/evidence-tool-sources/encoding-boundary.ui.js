function render(result){
 finish(result,'원본 '+result.inputByteLength+' 바이트 · UTF-16 '+result.utf16Units+' 단위 · 코드포인트 '+result.codePoints+'개\n디코딩 '+(result.decodeValid?'성공':'실패: 대체 문자 미리보기')+' · '+result.charset+(result.bom?' · BOM '+result.bom.name:''));
 if(result.truncation){const t=result.truncation;table('바이트 잘림',['요청 / 사용 바이트','엄격한 디코딩','표시문','UTF-8 안전한 접두부'],[[t.requestedBytes+' / '+t.takenBytes,t.decodeValid?'성공':'실패',t.decodedPreview,t.safeUtf8PrefixBytes===null?'지원 범위 아님':t.safeUtf8PrefixBytes+' 바이트: '+t.safeUtf8Text]]);}
 table('문자별 UTF-8 재계산'+(result.pointsTruncated?' (앞 2000개)':''),['UTF-16 위치','UTF-8 위치','코드포인트','문자','UTF-8 바이트'],result.points.map(p=>[p.utf16Offset,p.derivedUtf8Offset,p.codePoint,p.text,p.utf8Hex]));
}
$('run').addEventListener('click',async()=>{
 clear();const token=revision;try{
  const mode=$('mode').value,request={mode,charset:$('charset').value,limitBytes:$('limit').value};
  if(mode==='text')request.text=$('input').value;
  else if(mode==='hex')request.hex=$('input').value;
  else{const file=$('file').files[0];if(!file)throw new Error('원본 파일을 선택하세요.');if(file.size>131072)throw new Error('원본 파일은 최대 128 KiB입니다.');request.mode='bytes';request.bytes=Array.from(new Uint8Array(await file.arrayBuffer()));}
  if(token!==revision)return;render(WorklensTool.run(request));
 }catch(error){if(token===revision)status(error.message,true);}
});
$('sample').addEventListener('click',()=>{clear();$('mode').value='text';$('charset').value='utf-8';$('input').value='가A😀e\u0301';$('limit').value='5';status('합성 예제입니다. 5바이트에서 이모지 중간이 잘리는지 확인하세요.');});
$('mode').addEventListener('change',()=>{clear();if($('mode').value==='text')$('charset').value='utf-8';});
