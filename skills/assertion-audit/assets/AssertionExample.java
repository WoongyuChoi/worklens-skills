/** 합성 예제. JDK가 이미 있을 때만 선택 실행하며 외부 테스트 도구를 요구하지 않습니다. */
public final class AssertionExample {
    static String[] original() { return new String[] {"001", "002"}; }
    static String[] wrongIdentity() { return new String[] {"001", "999"}; }
    static void weak(String[] rows) {
        if (rows == null || rows.length != 2) throw new AssertionError("행 수");
    }
    static void strong(String[] rows) {
        weak(rows);
        if (!"001".equals(rows[0]) || !"002".equals(rows[1])) throw new AssertionError("행 식별자");
    }
    public static void main(String[] args) {
        weak(original());
        strong(original());
        weak(wrongIdentity());
        boolean detected = false;
        try { strong(wrongIdentity()); }
        catch (AssertionError expected) {
            if (!"행 식별자".equals(expected.getMessage())) throw expected;
            detected = true;
        }
        if (!detected) throw new AssertionError("의도적 결함이 검출되지 않았습니다");
        strong(original());
        System.out.println("약한 검증은 잘못된 식별자를 통과시켰고, 보강 검증은 실패했습니다. 원본 재확인 완료.");
    }
}
