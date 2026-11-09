'use strict';

const { randomUUID } = require('node:crypto');

const ACCESS_MS = 5 * 60 * 1000;
const REFRESH_MS = 30 * 60 * 1000;

class SessionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

class SessionService {
  constructor({ clock = Date.now } = {}) {
    this.clock = clock;
    this.sessions = new Map();
    this.accessTokens = new Map();
    this.refreshTokens = new Map();
  }

  startSession(subject, deviceLabel) {
    if (typeof subject !== 'string' || !subject || typeof deviceLabel !== 'string' || !deviceLabel) {
      throw new SessionError('INVALID_PRINCIPAL');
    }
    const sessionId = randomUUID();
    this.sessions.set(sessionId, {
      subject, deviceLabel, active: true, createdAt: this.clock()
    });
    return this.#issue(sessionId);
  }

  #issue(sessionId) {
    const issuedAt = this.clock();
    const accessToken = randomUUID();
    const refreshToken = randomUUID();
    this.accessTokens.set(accessToken, { sessionId, expiresAt: issuedAt + ACCESS_MS });
    this.refreshTokens.set(refreshToken, {
      sessionId, expiresAt: issuedAt + REFRESH_MS, consumedAt: null
    });
    return { accessToken, refreshToken, accessExpiresAt: issuedAt + ACCESS_MS };
  }

  authorize(accessToken) {
    const token = this.accessTokens.get(accessToken);
    if (!token || token.expiresAt <= this.clock()) throw new SessionError('ACCESS_DENIED');
    const session = this.sessions.get(token.sessionId);
    if (!session) throw new SessionError('ACCESS_DENIED');
    return { subject: session.subject, sessionId: token.sessionId };
  }

  refresh(refreshToken) {
    const token = this.refreshTokens.get(refreshToken);
    if (!token || token.expiresAt <= this.clock()) throw new SessionError('REFRESH_DENIED');
    const session = this.sessions.get(token.sessionId);
    if (!session || !session.active) throw new SessionError('REFRESH_DENIED');
    token.consumedAt = this.clock();
    return this.#issue(token.sessionId);
  }

  logout(accessToken) {
    const token = this.accessTokens.get(accessToken);
    if (!token || token.expiresAt <= this.clock()) throw new SessionError('ACCESS_DENIED');
    const session = this.sessions.get(token.sessionId);
    if (!session) throw new SessionError('ACCESS_DENIED');
    session.active = false;
    return { loggedOut: true };
  }
}

module.exports = { SessionService, SessionError, ACCESS_MS, REFRESH_MS };
