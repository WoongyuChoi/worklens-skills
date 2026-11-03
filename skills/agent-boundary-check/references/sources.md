# 조사 근거

확인일: 2026-11-03. 공개 자료의 일반적 검사 절차를 참고해 별도로 작성했습니다. 원문, 프레임워크, scanner는 복사·동봉하지 않았습니다.

- OWASP GenAI Red Teaming Manual v1.0 — 2026-10-20. 재현 가능한 검사, 측정 가능한 결과, 보고·개선의 연결. https://genai.owasp.org/resource/genai-red-teaming-manual-version-1-0/
- OWASP LLM Exploit Generation Guide 2.0 — 2026-10-27. 조사한 자율 실행에서 반복 활동과 운영상 한계를 다룹니다. 사내 Qwen의 성능에 대한 측정값으로 일반화하지 않습니다. https://genai.owasp.org/resource/llm-exploit-generation-guide-2-0/
- OWASP Agent Control Standard — 2026-09-01. 모델 문구와 별도로 실행 시점의 제어·관찰을 강조합니다. 해당 런타임과 의존성은 반입하지 않았습니다. https://genai.owasp.org/resource/agent-control-standard-acs/
- Trail of Bits agentic-actions-auditor — 확인한 파일 커밋 2026-08-31, 9645e2f89b2d3195847df5c82ddf68b67e4de90f. GitHub Actions 전용 원본의 입력→프롬프트→도구 권한 경계 관점을 참고했습니다. Qwen 호환 스킬로 포장하거나 원문을 재배포하지 않았습니다. 라이선스 CC-BY-SA-4.0. https://github.com/trailofbits/skills/blob/9645e2f89b2d3195847df5c82ddf68b67e4de90f/plugins/agentic-actions-auditor/skills/agentic-actions-auditor/SKILL.md
