'use strict';

const assert = require('node:assert/strict');
const { SessionService } = require('../src/session-service.cjs');
const { ProfileService } = require('../src/profile-service.cjs');

const sessions = new SessionService();
const profiles = new ProfileService(sessions);
const first = sessions.startSession('employee-sample-a', '합성 장치 A');
assert.equal(profiles.summary(first.accessToken).alias, '합성 사원 A');
const next = sessions.refresh(first.refreshToken);
assert.equal(profiles.preferences(next.accessToken).owner, 'employee-sample-a');
assert.equal(sessions.logout(next.accessToken).loggedOut, true);
console.log('정상 예제 완료: 로그인 → 프로필 조회 → 증표 교환 → 설정 조회 → 로그아웃');
console.log('메모리 합성 자료만 사용했으며 증표 원문을 출력하지 않았습니다.');
