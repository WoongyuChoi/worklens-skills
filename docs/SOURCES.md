# 참고 출처

확인일: 2026-09-23

아래 공개 원문에서 절차와 설계 관점을 참고했습니다.
Worklens의 지시문과 HTML 템플릿은 새로 작성했으며, 외부 프로젝트의 코드나 전체 지시문을 복제하지 않았습니다.
공개 사례의 존재와 사내 모델에서의 검증은 별개입니다.

| 공개 원문 | 참고한 부분 | Worklens에서 조정한 점 |
|---|---|---|
| [Superpowers: dispatching-parallel-agents](https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md) | 독립 작업의 분리와 결과 통합 | 실제 도구 확인, 기본 작업자 수 제한, 파일과 공유 자원 소유권, 순차 대안 |
| [Superpowers: subagent-driven-development](https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md) | 구현과 검토 담당 분리 | 단일 작성자 기본, Git 없는 기준본, 폐쇄망 로컬 검증, 제한된 수정 반복 |
| [Superpowers: verification-before-completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md) | 완료 주장 이전의 실행 근거 | 실행/정적/실패/미확인 구분, 최종 변경 후 재검증 |
| [Planning with Files](https://github.com/OthmanAdi/planning-with-files/blob/master/skills/planning-with-files/SKILL.md) | 파일에 진행 상황과 발견 사항 보존 | 단일 작업 인계 파일, 여러 작업 선택, 저장되지 않은 과거를 복원했다고 주장하지 않음 |
| [Anthropic: frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | 목적과 내용에 맞는 시각적 위계 | 한국어 가독성, 큰 글씨, 로컬 시스템 폰트, 실제 동작하는 오프라인 시안 |
| [Anthropic: claude-md-improver](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-md-management/skills/claude-md-improver/SKILL.md) | 프로젝트 지침 발견과 정리 | QWEN.md 연결, 확정한 규칙만 저장, 기존 지침 보존 |
| [Anthropic의 내부 스킬 활용 사례](https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills) | 반복 실수, 템플릿, 작은 전문 절차 | 입력 준비 부담을 줄이고 결과를 짧게 출력 |
| [Qwen Code Agent Skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/) | 스킬 경로와 검색/등록 방식 | 프로젝트 및 사용자 폴더 복사 설치, 선택 설치 |
| [Qwen Code Agent Tool](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/task/) | 실제 에이전트 호출과 병렬 실행 | 설치 버전에 도구가 없으면 순차 실행 |

## 외부 원문을 추가로 가져올 때

특정 버전의 원문을 직접 포함하게 되면 그 버전의 출처, 라이선스, 고지와 변경 내역을 함께 관리합니다.
링크된 원문의 라이선스가 Worklens의 라이선스로 바뀌는 것은 아닙니다.
현재 패키지의 실행 과정은 이 링크에 접속하지 않습니다.

## 2026-09-28 추가 발굴

[추가 후보 10개](NEXT-SKILLS.md)에 원문, 기존 스킬과의 차이, 폐쇄망 적용에 필요한 변경을 함께 기록했습니다.
추가 후보는 아직 구현하거나 검증한 스킬이 아닙니다. 기존 10개의 출처와 구분합니다.
