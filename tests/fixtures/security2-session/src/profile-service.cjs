'use strict';

const profiles = new Map([
  ['employee-sample-a', { alias: '합성 사원 A', department: '예제 부서' }],
  ['employee-sample-b', { alias: '합성 사원 B', department: '다른 예제 부서' }]
]);

class ProfileService {
  constructor(sessions) {
    this.sessions = sessions;
  }

  summary(accessToken) {
    const principal = this.sessions.authorize(accessToken);
    const profile = profiles.get(principal.subject);
    if (!profile) throw new Error('PROFILE_NOT_FOUND');
    return { ...profile, marker: `profile:${principal.subject}` };
  }

  preferences(accessToken) {
    const principal = this.sessions.authorize(accessToken);
    return { owner: principal.subject, compactView: true };
  }
}

module.exports = { ProfileService };
