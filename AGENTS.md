# Worklens contributor instructions

This repository publishes portable Qwen-oriented skills, not ChatGPT personal installations.
Keep skills in skills/<name>/SKILL.md. Store every required runtime asset within its skill folder.
Keep instructions in English and human-facing examples, labels and repository help in Korean.
Do not require network, package installation, Git, CI, Python or a database to use a skill.
Do not add CI workflows by default. Repository development checks may use already installed tools.
Use self-contained HTML/CSS/JavaScript assets and safe text rendering. Preserve raw data and numeric identifiers.
Independent review and forward-testing with subagents are allowed for changes to skill behavior. Keep reviewers on separate artifacts or read-only scopes.
Real parallel work needs an actual host tool; always provide an honest sequential fallback.
User requests must not become fabricated tool capabilities, unsupported completion claims or unnecessary setup questionnaires.
Record upstream inspiration in docs/SOURCES.md. Do not copy third-party code or instructions without the applicable license and attribution.
Keep README concise; show short Korean requests and actual outputs.
Run repository validation and meaningful asset checks after changes. Report the difference between local artifact tests and untested in-house Qwen behavior.
