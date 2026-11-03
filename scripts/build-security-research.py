#!/usr/bin/env python3
"""Maintainer-only offline research document builder. No external dependencies."""
from pathlib import Path
import html
import re
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'docs/SECURITY-RESEARCH-2026-11.md').read_text()

def inline(text):
    tokens=[]
    def stash(value):
        tokens.append(value)
        return f'ZZINLINE{len(tokens)-1}ZZ'
    text=re.sub(r'`([^`]+)`',lambda m:stash('<code>'+html.escape(m[1])+'</code>'),text)
    def link(m):
        label,url=m.group(1),m.group(2)
        if not url.startswith(('https://','http://')):
            return stash(html.escape(label)+' <span class="muted">(팩의 '+html.escape(url)+')</span>')
        return stash('<a href="'+html.escape(url,quote=True)+'" target="_blank" rel="noopener noreferrer">'+html.escape(label)+'</a>')
    text=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)
    text=html.escape(text)
    text=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',text)
    for i,value in enumerate(tokens):text=text.replace(f'ZZINLINE{i}ZZ',value)
    return text

lines=source.splitlines();out=[];nav=[];i=0;section=0
while i<len(lines):
    line=lines[i]
    if not line.strip() or line.startswith('# '):i+=1;continue
    if line.startswith('## '):
        section+=1;title=line[3:];nav.append((f's{section}',title));out.append(f'<h2 id="s{section}">{inline(title)}</h2>');i+=1;continue
    if line.startswith('|'):
        table=[]
        while i<len(lines) and lines[i].startswith('|'):
            if not re.fullmatch(r'[|\s:-]+',lines[i]):table.append([inline(c.strip()) for c in lines[i].strip('|').split('|')])
            i+=1
        out.append('<div class="tablewrap"><table><thead><tr>'+''.join('<th>'+x+'</th>' for x in table[0])+'</tr></thead><tbody>')
        for row in table[1:]:out.append('<tr>'+''.join('<td>'+x+'</td>' for x in row)+'</tr>')
        out.append('</tbody></table></div>');continue
    if line.startswith('- ') or re.match(r'^\d+\. ',line):
        ordered=bool(re.match(r'^\d+\. ',line));tag='ol' if ordered else 'ul';out.append('<'+tag+'>')
        while i<len(lines) and (re.match(r'^\d+\. ',lines[i]) if ordered else lines[i].startswith('- ')):
            item=re.sub(r'^\d+\. ','',lines[i]) if ordered else lines[i][2:];out.append('<li>'+inline(item)+'</li>');i+=1
        out.append('</'+tag+'>');continue
    para=[]
    while i<len(lines) and lines[i].strip() and not lines[i].startswith(('## ','|','- ')) and not re.match(r'^\d+\. ',lines[i]):para.append(lines[i]);i+=1
    out.append('<p>'+inline(' '.join(para))+'</p>')
nav_html=''.join('<a href="#'+ident+'">'+html.escape(title)+'</a>' for ident,title in nav)
flow='''<figure><svg viewBox="0 0 760 390" role="img" aria-label="소스와 기존 자료에서 보안 가설을 만들고 로컬 재현, 지정 API 검증, 호스트 기록 분석으로 나눠 근거와 미검증 범위를 보고하는 흐름"><g fill="none" stroke="#7ba49b" stroke-width="2"><path d="M380 65V100M380 155V185H135V215M380 185V215M380 185H625V215M135 270V300H380V325M380 270V325M625 270V300H380"/></g><g fill="#fff" stroke="#9bb8b2"><rect x="205" y="10" width="350" height="55" rx="10"/><rect x="205" y="100" width="350" height="55" rx="10"/><rect x="30" y="215" width="210" height="55" rx="10"/><rect x="275" y="215" width="210" height="55" rx="10"/><rect x="520" y="215" width="210" height="55" rx="10"/><rect x="205" y="325" width="350" height="55" rx="10"/></g><g text-anchor="middle" fill="#1e413c" font-family="system-ui,sans-serif" font-size="16"><text x="380" y="44">소스 · 설정 · 필드명 · 기존 자료</text><text x="380" y="134">보안 가설 · 범위 · 기대 결과</text><text x="135" y="249">로컬 합성 재현</text><text x="380" y="249">지정 API 검증</text><text x="625" y="249">호스트 기록 분석</text><text x="380" y="359">근거 · 미검증 범위 · 수정 · 재검증</text></g></svg><figcaption>각 검사는 가능한 실행 경로를 선택합니다. 소스만 읽은 경우에는 정적 확인으로 남깁니다.</figcaption></figure>'''
page='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>Worklens 보안 스킬 5개 · 조사와 적용 보고서</title><style>
:root{--ink:#18352e;--muted:#576d64;--green:#116b56;--line:#d0dcd5}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f3f5ef;color:var(--ink);font:16px/1.85 system-ui,-apple-system,sans-serif}header,main,footer{max-width:1150px;margin:auto;padding:36px 36px}header{padding-top:56px;background:#173c32;color:#f0f4e8;max-width:none}header>div{max-width:1078px;margin:auto}.eyebrow{font-size:12px;letter-spacing:.18em;color:#b8d5b7;font-weight:750}h1{font-size:46px;line-height:1.22;letter-spacing:-.04em;max-width:850px;margin:18px 0}header p{color:#d6e3d5;max-width:850px}.stats{display:flex;gap:24px;margin:28px 0 12px;flex-wrap:wrap}.stat{border-top:1px solid #587c67;min-width:160px;padding:14px 0}.stat b{display:block;font-size:32px}.stat span{font-size:12px;color:#c7d8c6}h2{font-size:26px;line-height:1.4;margin:52px 0 20px;padding-top:16px;border-top:1px solid var(--line);scroll-margin-top:20px}a{color:#12654e;text-underline-offset:4px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #bd841b;outline-offset:3px}nav{background:#fff;border:1px solid var(--line);padding:20px 24px;border-radius:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px 22px;margin-bottom:28px}nav a{font-size:13px;text-decoration:none}p{margin:16px 0}li{margin:9px 0}code{font:13px/1.65 ui-monospace,monospace;background:#e7eee5;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}.tablewrap{overflow-x:auto;background:white;border:1px solid var(--line);border-radius:10px;margin:20px 0}table{border-collapse:collapse;width:100%;font-size:13px;line-height:1.75}th{background:#e3ece1;text-align:left;color:#214a3c}td,th{padding:14px 15px;vertical-align:top;border-bottom:1px solid var(--line)}tr:last-child td{border-bottom:0}td:first-child{font-weight:650}strong{font-weight:750}figure{margin:30px 0;padding:16px 24px;background:#edf2e9;border-radius:14px}figure svg{width:100%;max-height:390px;display:block}figcaption{font-size:12px;color:var(--muted);text-align:center;margin-top:10px}.muted{font-size:12px;color:var(--muted)}footer{font-size:12px;color:var(--muted);border-top:1px solid var(--line)}@media(max-width:760px){header,main,footer{padding:26px 18px}h1{font-size:32px}h2{font-size:22px}nav{grid-template-columns:1fr}table{min-width:700px}.stats{gap:16px}.stat{min-width:130px}figure{padding:8px}}@media print{body{background:white;font-size:10px}header{background:white;color:#18352e;padding:12px 0}header p,.eyebrow{color:#576d64}h1{font-size:25px}main,footer{padding:12px 0;max-width:none}nav{display:none}.stats{margin:8px 0}.stat{padding:4px}.stat b{font-size:20px}.stat span{color:#576d64}h2{font-size:17px;margin:25px 0 12px}.tablewrap{overflow:visible}table{font-size:9px;min-width:0}td,th{padding:6px}tr{break-inside:avoid}figure{break-inside:avoid}a{color:#18352e}code{font-size:9px}}
</style></head><body><header><div><div class="eyebrow">WORKLENS / SECURITY SKILLS / 2026.11.03</div><h1>소스에서 찾고,<br>실제 근거로 판단하는 보안 스킬.</h1><p>사내 Qwen Agent에 맞춰 커스텀할 다섯 가지 기반. 무인증 API, 개인정보 로그, 입력 경로, 의존성 취약점, 에이전트 입력 경계를 한정된 재현과 보고서로 연결합니다.</p><div class="stats"><div class="stat"><b>5개</b><span>신규 보안 스킬</span></div><div class="stat"><b>45개</b><span>기존 40개 포함 전체</span></div><div class="stat"><b>2026.10</b><span>최근 OWASP 자료 반영</span></div><div class="stat"><b>추가 설치 없음</b><span>표준 기능 · 기존 호스트 활용</span></div></div></div></header><main><nav aria-label="보고서 목차">'''+nav_html+'</nav>'+flow+''.join(out)+'''</main><footer>조사 기준일 2026-11-03 · 사용자 추가 사례 반영 · 실제 사내 취약점 진단 결과가 아닌 선정·구현 보고서입니다. 출처는 각 주장 가까이에 연결했습니다. 이 파일은 서버·CDN·외부 폰트를 사용하지 않습니다.</footer></body></html>'''
(ROOT/'docs/SECURITY-RESEARCH-2026-11.html').write_text(page)
print('Built standalone security research HTML.')
