import java.util.function.UnaryOperator;

/** 합성 규칙: ASCII 공백 양끝 제거 후 내부 연속 공백을 하나로 만듭니다. */
public final class InvariantExample {
    static String canonical(String input) {
        return input.replaceAll("^ +| +$", "").replaceAll(" +", " ");
    }
    static String onePassDefect(String input) {
        return input.replaceAll("^ +| +$", "").replace("  ", " ");
    }
    static boolean idempotent(UnaryOperator<String> function, String input) {
        return function.apply(function.apply(input)).equals(function.apply(input));
    }
    private static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    public static void main(String[] args) {
        String[] cases = {"", " ", "가", "가 나", " 가    나 ", "가          나", "가\t나"};
        for (String input : cases) check(idempotent(InvariantExample::canonical, input), "멱등성: " + input);
        check(canonical(" 가    나 ").equals("가 나"), "독립 기준값");
        check(canonical("가\t나").equals("가\t나"), "ASCII 공백 외 문자는 보존");
        check(!idempotent(InvariantExample::onePassDefect, "가    나"), "한 번만 줄이는 결함 검출");
        System.out.println("합성 입력 7개, 기준값 2개, 의도적 결함 검출 1개 확인. 실제 업무 시험은 아닙니다.");
    }
}
