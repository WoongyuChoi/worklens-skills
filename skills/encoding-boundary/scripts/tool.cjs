/* Portable engine. Browser uses the same code; Node is optional. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WorklensTool=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const MAX=131072;
function fail(message){throw new Error(message);}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ');}
function parseHex(value){
 if(typeof value!=='string'||value.length>MAX*3+1024)fail('16진수 입력은 최대 128 KiB입니다.');
 const compact=value.replace(/\s/g,'');
 if(!/^(?:[0-9a-fA-F]{2})*$/.test(compact))fail('공백으로 구분한 2자리 16진수만 입력하세요. 예: EA B0 80');
 if(compact.length/2>MAX)fail('원본 바이트는 최대 128 KiB입니다.');
 return Uint8Array.from(compact.match(/../g)||[],s=>parseInt(s,16));
}
function decode(bytes,charset){
 let decoder;try{decoder=new TextDecoder(charset,{fatal:true,ignoreBOM:true});}catch(_){fail('현재 환경에서 지원하지 않는 문자셋입니다: '+charset);}
 try{return {valid:true,text:decoder.decode(bytes),charset:decoder.encoding,error:null};}
 catch(_){return {valid:false,text:new TextDecoder(charset,{ignoreBOM:true}).decode(bytes),charset:decoder.encoding,error:'선택한 문자셋으로 엄격한 디코딩에 실패했습니다. 표시문은 대체 문자가 들어간 미리보기입니다.'};}
}
function bomOf(b){
 const signatures=[['UTF-32BE',[0,0,254,255]],['UTF-32LE',[255,254,0,0]],['UTF-8',[239,187,191]],['UTF-16BE',[254,255]],['UTF-16LE',[255,254]]];
 for(const [name,seq]of signatures)if(seq.every((v,i)=>b[i]===v))return {name,bytes:seq.length};
 return null;
}
function run(req){
 if(!req||typeof req!=='object'||Array.isArray(req))fail('요청 객체가 필요합니다.');
 const mode=req.mode===undefined?'text':req.mode;
 if(req.charset!==undefined&&(typeof req.charset!=='string'||!req.charset.trim()))fail('문자셋 이름은 비어 있지 않은 문자열이어야 합니다.');
 const charset=(req.charset===undefined?'utf-8':req.charset).trim().toLowerCase();let bytes;
 if(mode==='text'){
  if(typeof req.text!=='string'||req.text.length>MAX)fail('텍스트는 최대 131072 UTF-16 단위입니다.');
  for(let i=0;i<req.text.length;i++){const n=req.text.charCodeAt(i);if(n>=0xD800&&n<=0xDBFF){const m=req.text.charCodeAt(++i);if(!(m>=0xDC00&&m<=0xDFFF))fail('짝이 없는 UTF-16 서로게이트가 있습니다. 원본 바이트로 확인하세요.');}else if(n>=0xDC00&&n<=0xDFFF)fail('짝이 없는 UTF-16 서로게이트가 있습니다. 원본 바이트로 확인하세요.');}
  if(charset!=='utf-8'&&charset!=='utf8')fail('텍스트 재인코딩은 UTF-8만 지원합니다. 다른 문자셋은 원본 바이트를 넣어 디코딩하세요.');
  bytes=new TextEncoder().encode(req.text);
 }else if(mode==='hex')bytes=parseHex(req.hex);
 else if(mode==='bytes'){
  if(!Array.isArray(req.bytes)||req.bytes.length>MAX||req.bytes.some(n=>!Number.isInteger(n)||n<0||n>255))fail('바이트 배열은 0~255 정수, 최대 128 KiB입니다.');
  bytes=Uint8Array.from(req.bytes);
 }else fail('mode는 text, hex, bytes 중 하나여야 합니다.');
 if(bytes.length>MAX)fail('변환된 바이트가 128 KiB를 넘습니다.');
 const full=decode(bytes,charset),utf8=new TextEncoder().encode(full.text),points=[];let index=0,byteOffset=0,count=0;
 for(const ch of full.text){const b=new TextEncoder().encode(ch);if(points.length<2000)points.push({utf16Offset:index,derivedUtf8Offset:byteOffset,codePoint:'U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'),text:ch,utf16Units:ch.length,utf8Bytes:b.length,utf8Hex:hex(b)});index+=ch.length;byteOffset+=b.length;count++;}
 let truncation=null;
 if(req.limitBytes!==undefined&&req.limitBytes!==null&&req.limitBytes!==''){
  if(typeof req.limitBytes!=='number'&&!(typeof req.limitBytes==='string'&&/^\d+$/.test(req.limitBytes)))fail('바이트 제한은 정수여야 합니다.');
  const n=Number(req.limitBytes);if(!Number.isSafeInteger(n)||n<0||n>MAX)fail('바이트 제한은 0~131072 사이 정수여야 합니다.');
  const cut=Math.min(n,bytes.length),prefix=decode(bytes.slice(0,cut),charset);let safe=null;
  if(full.valid&&full.charset==='utf-8'){
   safe=cut;while(safe>0&&!decode(bytes.slice(0,safe),'utf-8').valid)safe--;
  }
  truncation={requestedBytes:n,takenBytes:cut,hex:hex(bytes.slice(0,cut)),decodeValid:prefix.valid,decodedPreview:prefix.text,safeUtf8PrefixBytes:safe,safeUtf8Text:safe===null?null:decode(bytes.slice(0,safe),'utf-8').text};
 }
 return {tool:'encoding-boundary',verification:'로컬 바이트 계산',inputKind:mode,inputByteLength:bytes.length,originalHex:hex(bytes),bom:bomOf(bytes),charset:full.charset,decodeValid:full.valid,decodeError:full.error,decodedText:full.text,utf16Units:full.text.length,codePoints:count,derivedUtf8ByteLength:utf8.length,nfcUnchanged:full.text.normalize('NFC')===full.text,nfdUnchanged:full.text.normalize('NFD')===full.text,points,pointsTruncated:count>points.length,truncation,limits:['원래 문자셋을 추정하거나 확정하지 않습니다. 선택한 디코더의 성공만 확인합니다.','문자별 바이트 오프셋은 표시문을 UTF-8로 다시 계산한 값입니다. 원본이 다른 문자셋이면 원본 오프셋이 아닙니다.','코드포인트 수는 사용자에게 보이는 글자 수와 다를 수 있습니다. 정규화·복원·파일 덮어쓰기를 하지 않습니다.','EUC-KR/MS949 바이트 재인코딩은 지원하지 않습니다. BOM은 제거하지 않고 표시문에 유지합니다.']};
}
return {run,parseHex};
});
if(typeof require==='function'&&typeof module==='object'&&require.main===module){try{const fs=require('node:fs');if(process.argv.length!==4)throw new Error('사용법: node tool.cjs 요청.json 새결과.json');const result=module.exports.run(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(process.argv[2]))));fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});}catch(e){console.error(e.message);process.exitCode=1;}}
