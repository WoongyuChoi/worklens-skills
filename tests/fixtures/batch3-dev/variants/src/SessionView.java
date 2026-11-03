class SessionView {
    boolean stillCurrent(Object scheduledToken, Object currentToken) {
        return scheduledToken == currentToken;
    }
}
