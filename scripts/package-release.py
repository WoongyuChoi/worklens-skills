#!/usr/bin/env python3
"""Maintainer-only release packaging with Python's standard library.
Skill users copy skill folders; this maintainer script is not required.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DATE = "20261109"
CATEGORIES = {"00_common": "공통", "10_design": "설계·화면 동작", "20_dev": "개발·운영 진단", "30_test": "테스트", "40_security": "보안", "90_doc": "문서·리포트"}


def catalog():
    existing = json.loads((ROOT / "scripts/existing-catalog.json").read_text())
    added = json.loads((ROOT / "scripts/batch3-catalog.json").read_text())
    for item in added:
        item["batch"] = 3
    security = json.loads((ROOT / "scripts/security-catalog.json").read_text())
    for item in security:
        item["batch"] = 4
    security2 = json.loads((ROOT / "scripts/security2-catalog.json").read_text())
    for item in security2:
        item["batch"] = 5
    items = existing + added + security + security2
    assert len(items) == 50 and len({i["name"] for i in items}) == 50
    for item in items:
        folder = ROOT / "skills" / item["name"]
        assert (folder / "SKILL.md").is_file()
        item["html"] = [f"skills/{item['name']}/assets/{p.name}" for p in sorted((folder / "assets").glob("*.html"))]
        item["lowerPriority"] = item["name"] in ("dev-conductor", "parallel-batch")
    return items


def index_html(items):
    data = json.dumps(items, ensure_ascii=False).replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    options = "".join(f'<option value="{key}">{key} · {html.escape(label)}</option>' for key, label in CATEGORIES.items())
    template = r'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>Worklens Skills · 시작하기</title><style>
:root{color-scheme:light;--ink:#172b3d;--line:#cbd8e0;--accent:#0f6259}*{box-sizing:border-box}body{margin:0;background:#f1f5f7;color:var(--ink);font:15px/1.6 system-ui,sans-serif}header,main,footer{max-width:1250px;margin:auto;padding:30px 24px}header{padding-bottom:12px}.eyebrow{font-size:12px;color:var(--accent);letter-spacing:.14em;font-weight:750}h1{font-size:38px;line-height:1.2;margin:12px 0 18px}h2{font-size:20px;margin:6px 0}p{margin:8px 0 14px}.lead{font-size:17px;max-width:800px;color:#415b6e}.instructions{padding:16px 22px;border-left:4px solid var(--accent);background:white}.controls{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;align-items:end}label{font-size:13px;font-weight:650;display:block;flex:1;min-width:180px}input[type=search],select{display:block;width:100%;font:inherit;background:white;border:1px solid #8ca7b9;border-radius:7px;padding:11px;margin-top:5px}label.check{min-width:180px;flex:0 1 auto;padding-bottom:12px}input[type=checkbox]{width:17px;height:17px;vertical-align:middle;margin-right:7px}#count{color:#526c7d}#cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{border:1px solid var(--line);background:white;border-radius:14px;padding:20px;display:flex;flex-direction:column;min-width:0}.tag{color:var(--accent);font-size:12px;font-weight:750}.id{font:12px ui-monospace,monospace;color:#586f80;overflow-wrap:anywhere}.prompt{background:#f2f7f7;padding:12px;border-radius:7px;font-size:14px;margin:14px 0}.state{font-size:12px;color:#587083;margin-top:auto}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}a{color:#075b65;text-underline-offset:3px}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #dc9c12;outline-offset:3px}.links a{font-size:13px;border:1px solid #b0c7cd;padding:6px 10px;border-radius:6px;text-decoration:none}.notice{font-size:13px;color:#684a19;background:#fff7e6;padding:12px 16px;border-radius:8px}footer{font-size:12px;color:#526c7d}@media(max-width:1000px){#cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){header,main,footer{padding:20px 16px}h1{font-size:30px}#cards{grid-template-columns:1fr}.controls label{flex-basis:100%}}
</style></head><body><header><div class="eyebrow">WORKLENS / PORTABLE SKILLS / 2026.11.09</div><h1>필요한 문제에서 시작하세요.</h1><p class="lead">짧은 요청으로 코드를 살피고, 근거를 남기고, 오프라인 도구로 확인합니다. 이 팩에는 <strong>__COUNT__개</strong> 스킬이 있습니다.</p><div class="instructions"><strong>사용 방법</strong><p>로컬 Agent에서 사용할 스킬은 <code>skills/스킬이름</code> 폴더째 복사하세요. SKILL.md만 복사하면 참조 문서와 도구가 빠집니다. 보안 보고서는 Markdown이 기본이며 별도 JSON 업로드가 없습니다.</p><a href="README.md">설치 안내 읽기</a></div></header><main><div class="controls"><label>문제·요청·스킬 이름<input id="search" type="search" placeholder="예: Mapper, 월말, 복구, 데이터"></label><label>카테고리<select id="category"><option value="">전체 카테고리</option>__OPTIONS__</select></label><label>구분<select id="batch"><option value="">전체</option><option value="security">보안 전체 10개</option><option value="security2">이번 보안 5개</option><option value="new">3차 20개</option><option value="old">기존 20개</option><option value="html">HTML 도구 포함</option></select></label><label class="check"><input id="priority" type="checkbox">우선 시험 항목</label></div><p id="count" role="status" aria-live="polite"></p><div id="cards"></div><p class="notice">기존 보안 5개는 채택·적용 결정, 이번 보안 5개는 사내 검증 전입니다. 사내 Agent 실행 실적은 별도로 확인해야 합니다. 실제 프로젝트 실행이 필요한 검토는 환경에 따라 정적 분석에 머물 수 있습니다. HTML은 서버나 DB에 연결하지 않습니다.</p></main><footer>분류는 찾아보기용입니다. 스킬 폴더를 카테고리 하위로 옮기지 않아도 됩니다. 기존 개별 평가가 없는 스킬의 유용성을 임의로 확정하지 않습니다.</footer><script>
'use strict';
const items=__DATA__, $=id=>document.getElementById(id);
function el(tag,text,className){const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;}
function render(){const query=$('search').value.toLowerCase().trim(),category=$('category').value,batch=$('batch').value,priority=$('priority').checked;
 const selected=items.filter(i=>(!query||[i.name,i.title,i.prompt,i.category].join(' ').toLowerCase().includes(query))&&(!category||i.category===category)&&(!priority||i.priority)&&(!batch||(batch==='new'?i.batch===3:batch==='security'?i.category==='40_security':batch==='security2'?i.batch===5:batch==='old'?i.batch<3:i.html.length>0)));
 $('count').textContent=selected.length+' / '+items.length+'개';$('cards').replaceChildren();
 for(const i of selected){const card=el('article','','card');card.append(el('div',i.category+(i.priority?' · 우선 시험':''),'tag'),el('h2',i.title),el('div',i.name,'id'),el('p','“'+i.prompt+'”','prompt'),el('div',i.batch>=3?(i.batch===5?'추가 보안 · 사내 검증 전':i.batch===4?'보안 1차 · 채택·적용 결정 / 실행 검증 미기록':'3차 신규 · 사내 확인 전'):i.lowerPriority?'기존 · 효용 낮음 피드백 / 추천 우선순위 낮춤':'기존 · 사내 반영 완료 / 개별 평가 미기록','state'));const links=el('div','','links'),doc=el('a','스킬 지침');doc.href='skills/'+i.name+'/SKILL.md';links.append(doc);for(const asset of i.html){const a=el('a',i.html.length===1?'HTML 열기':asset.split('/').pop());a.href=asset;links.append(a);}card.append(links);$('cards').append(card);}
 if(!selected.length)$('cards').append(el('p','검색 결과가 없습니다. 검색어나 분류를 바꿔 보세요.'));
}
document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',render));render();
</script></body></html>
'''
    return template.replace("__COUNT__", str(len(items))).replace("__OPTIONS__", options).replace("__DATA__", data)


def markdown_catalog(items):
    title = "전체 스킬 목록" if len(items) == 50 else f"이 팩의 스킬 {len(items)}개"
    lines = [f"# {title}", "", "2026-11-09 · 기존 20개 반영 완료 / 3차 20개 확인 전 / 보안 1차 5개 채택·적용 결정 / 보안 2차 5개 사내 검증 전", "", "분류는 사내 정리함을 참고한 찾아보기용입니다. 실제 배포 폴더는 `skills/스킬이름`입니다.", ""]
    for category, label in CATEGORIES.items():
        if not any(item["category"] == category for item in items):
            continue
        lines += [f"## {category} · {label}", "", "| 스킬 | 짧은 요청 | 구분 |", "|---|---|---|"]
        for item in items:
            if item["category"] == category:
                state = "보안 2차·검증 후보" if item["batch"] == 5 else "보안 1차·채택·적용 결정" if item["batch"] == 4 else "3차·우선 시험" if item["batch"] == 3 and item.get("priority") else "3차 신규" if item["batch"] == 3 else "기존·추천 우선순위 낮음" if item["lowerPriority"] else "기존·반영 완료"
                lines.append(f"| [{item['title']}](../skills/{item['name']}/SKILL.md) `{item['name']}` | {item['prompt']} | {state} |")
        lines += [""]
    return "\n".join(lines)


def readme(items, kind):
    title = "이번 보안 5개 추가팩" if kind == "security-next" else "보안 10개 통합팩" if kind == "security" else f"전체 {len(items)}개 통합팩"
    lines = [f"# Worklens Skills — {title}", "", "작성일: 2026-11-09 · 보안 카테고리: 40_security", "", "## 시작하기", "", "1. 압축을 풀고 아래 목록에서 필요한 스킬을 고릅니다.", "2. `skills/스킬이름`을 사내 Agent가 읽는 위치에 **폴더째** 복사합니다. 사내 등록 규칙을 우선합니다.", "3. 현재 프로젝트와 함께 아래의 짧은 요청을 전달합니다. 자동 선택이 불안정하면 스킬 이름을 명시합니다.", "", "Qwen뿐 아니라 Markdown 지침과 로컬 파일을 읽는 Agent가 사용할 수 있도록 작성했습니다. 각 제품의 로더/도구 호환성을 실제 검증했다는 뜻은 아닙니다. 실행 도구가 없으면 정적 검토와 구체적인 미검증 항목을 남깁니다.", "", "## 보고서와 실행", "", "- 보안 스킬의 기본 결과는 완성된 Markdown 보고서입니다. 사용자가 JSON을 만들거나 업로드하지 않습니다.", "- HTML이 필요한 경우 `references/report-blueprint.md`의 디자인과 전체 소스를 읽어 실제 결과가 들어간 단일 파일을 Agent가 생성합니다.", "- 소스 검토에는 인터넷·CDN·추가 패키지·별도 Git·CI·DB가 필요하지 않습니다. 재현은 프로젝트에 이미 있는 실행환경과 지정된 테스트 범위를 사용합니다.", "- 이번 5개에는 별도 실행기나 스캐너 설치가 없습니다. 기존 5개에 남아 있는 Node 보조도구도 선택 사항입니다.", "- 합성 소스 실행과 사내 시스템·Qwen 실행을 구분합니다. 이번 환경에서는 실제 Chromium이 시작 권한 제한으로 실행되지 않아 브라우저 동작은 미검증입니다. 실제 사내 침투 결과는 포함하지 않습니다.", "", "## 포함된 스킬", "", "| 카테고리 | 스킬 | 짧은 요청 |", "|---|---|---|"]
    for i in items:
        lines.append(f"| {i['category']} | [{i['title']}](skills/{i['name']}/SKILL.md) | {i['prompt']} |")
    lines += ["", "## 업데이트 범위", "", "이번 신규 5개는 기존과 다른 이름의 폴더입니다. 보안 10개 팩은 기존 보안 5개의 Markdown 출력 개선도 포함합니다. 자체 수정한 기존 폴더는 백업·비교한 뒤 필요한 변경만 반영하세요. 기존 `assets/report.html`과 `scripts/render-report.cjs`는 더 이상 쓰지 않으며 이 팩에 없습니다. 덮어쓰기 복사만으로 예전 파일이 자동 삭제되지는 않습니다. 자동 설치·기존 폴더 삭제는 수행하지 않습니다.", "", "기존 보안 5개는 2026-11-09 사용자 피드백에 따라 **채택·적용 결정**으로 기록합니다. 실제 설치/실행 완료와 같은 뜻이 아닙니다. 이번 신규 5개는 사내 검증 전입니다.", "", "## 안내와 출처", "", "- [활용 안내](docs/SECURITY-GUIDE.md)", "- [최신 조사와 선정 근거](docs/SECURITY-RESEARCH-2026-11-09.md)", "- [보고서 규칙](docs/SECURITY-REPORT-FORMAT.md)", "- [출처와 독립 작성 범위](docs/SOURCES.md)", "- [검증 기록](docs/VALIDATION.md)", "- `MANIFEST.sha256`: 압축 안 파일의 SHA-256 목록", "", "외부 스킬 원문·코드를 재배포하지 않습니다. 공개 절차와 공식 자료를 참고해 독립 작성했습니다. 동봉한 LICENSE를 따릅니다.", ""]
    return "\n".join(lines)


def package(items, kind, output):
    slug = f"worklens-skills-{kind}-{len(items)}-{DATE}"
    files = {"README.md": readme(items, kind).encode(), "docs/CATALOG.md": markdown_catalog(items).encode(), "LICENSE": (ROOT / "LICENSE").read_bytes(), "catalog.json": (json.dumps(items, ensure_ascii=False, indent=2) + "\n").encode()}
    if kind == "all":
        files["index.html"] = index_html(items).encode()
    for item in items:
        skill_dir = ROOT / "skills" / item["name"]
        for source in sorted(skill_dir.rglob("*")):
            if source.is_file() and not source.is_symlink() and not any(p.startswith('.') or p=='__pycache__' for p in source.relative_to(skill_dir).parts):
                files[source.relative_to(ROOT).as_posix()] = source.read_bytes()
    doc_names = ["VALIDATION.md", "SECURITY-GUIDE.md", "SECURITY-RESEARCH-2026-11-09.md", "SECURITY-REPORT-FORMAT.md"]
    if kind == "all":
        doc_names += ["SECURITY-RESEARCH-2026-11.md", "SOURCES.md", "BATCH3-GUIDE.md", "NEXT-SKILLS.md", "CANDIDATES-2026-11.md", "ADOPTION.md", "TRY-IT.md"]
    else:
        sources = (ROOT / "docs/SOURCES.md").read_text()
        marker = "## 5차 보안 5개" if kind == "security-next" else "## 4차 보안 5개"
        files["docs/SOURCES.md"] = ("# 보안 스킬 출처\n\n" + sources[sources.index(marker):]).encode()
        if kind == "security":
            doc_names += ["SECURITY-RESEARCH-2026-11.md"]
    for name in doc_names:
        files["docs/"+name] = (ROOT / "docs" / name).read_bytes()
    hashes = "".join(hashlib.sha256(content).hexdigest()+"  "+name+"\n" for name, content in sorted(files.items()))
    files["MANIFEST.sha256"] = hashes.encode()
    output.mkdir(parents=True, exist_ok=True)
    destination = output / (slug+".zip")
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, content in sorted(files.items()):
            entry = zipfile.ZipInfo(slug+"/"+name, (2026,11,9,0,0,0))
            entry.compress_type=zipfile.ZIP_DEFLATED
            entry.external_attr=0o100644 << 16
            archive.writestr(entry, content, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    verify(destination, items, kind)
    return {"path":str(destination.resolve()),"skills":len(items),"files":len(files),"bytes":destination.stat().st_size,"sha256":hashlib.sha256(destination.read_bytes()).hexdigest()}


def verify(destination, items, kind):
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None
        names=archive.namelist();prefix=names[0].split('/')[0]+'/'
        contents={n[len(prefix):]:archive.read(n) for n in names}
        assert len([n for n in contents if re.fullmatch(r'skills/[^/]+/SKILL.md',n)])==len(items)
        if kind != 'all':
            assert not any(n.endswith('.html') for n in contents), 'Security packs must not bundle HTML viewers'
        assert not any('render-report.cjs' in n for n in contents)
        for line in contents['MANIFEST.sha256'].decode().splitlines():
            expected,name=line.split('  ',1);assert hashlib.sha256(contents[name]).hexdigest()==expected,name
        for item in items:
            skill=contents[f"skills/{item['name']}/SKILL.md"].decode()
            for target in re.findall(r'(?:assets|references|scripts)/[a-zA-Z0-9_.-]+\.(?:md|html|json|csv|cjs|java|xml|txt)',skill):
                assert f"skills/{item['name']}/{target}" in contents,target
            for asset in item['html']:
                assert asset in contents
        assert not any('/.git/' in n or '/node_modules/' in n or '/test-results/' in n for n in names)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path)
    parser.add_argument('--catalog-only',action='store_true')
    args=parser.parse_args()
    items=catalog()
    (ROOT/'index.html').write_text(index_html(items))
    (ROOT/'docs/CATALOG.md').write_text(markdown_catalog(items))
    if args.catalog_only:
        print('Updated index.html and docs/CATALOG.md for '+str(len(items))+' skills')
        return
    if not args.output:
        parser.error('--output is required when building ZIPs')
    results=[package([i for i in items if i['batch']==5],'security-next',args.output),package([i for i in items if i['category']=='40_security'],'security',args.output),package(items,'all',args.output)]
    print(json.dumps(results,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
