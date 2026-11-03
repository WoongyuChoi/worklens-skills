import java.time.*;

/** 합성 예제. 이미 설치된 JDK에서만 선택 실행합니다. DB 연결은 없습니다. */
public final class BoundaryExample {
    private static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }
    static boolean includes(YearMonth month, ZoneId zone, Instant event) {
        Instant start = month.atDay(1).atStartOfDay(zone).toInstant();
        Instant next = month.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();
        return !event.isBefore(start) && event.isBefore(next);
    }
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Asia/Seoul");
        Clock clock = Clock.fixed(Instant.parse("2024-03-01T00:00:00Z"), zone);
        YearMonth previous = YearMonth.from(LocalDate.now(clock)).minusMonths(1);
        check(previous.equals(YearMonth.of(2024, 2)), "고정 시계의 전월");
        check(!includes(previous, zone, Instant.parse("2024-01-31T14:59:59.999999999Z")), "시작 직전 제외");
        check(includes(previous, zone, Instant.parse("2024-01-31T15:00:00Z")), "시작 포함");
        check(includes(previous, zone, Instant.parse("2024-02-29T14:59:59.999999999Z")), "윤년 끝 직전 포함");
        check(!includes(previous, zone, Instant.parse("2024-02-29T15:00:00Z")), "다음 시작 제외");
        check(includes(YearMonth.of(2023, 12), zone, Instant.parse("2023-12-31T14:59:59Z")), "연말 끝 직전 포함");
        check(!includes(YearMonth.of(2023, 12), zone, Instant.parse("2023-12-31T15:00:00Z")), "다음 해 시작 제외");
        System.out.println("합성 날짜 경계 7개 확인. 실제 업무 규칙·DB/JDBC 실행은 확인하지 않았습니다.");
    }
}
