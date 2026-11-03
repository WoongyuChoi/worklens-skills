/** 합성 업무 코드. 식별자는 선행 0이 의미 있는 문자열입니다. */
public final class DirectoryLookup {
    static final class User {
        final String id;
        final String name;
        User(String id, String name) { this.id = id; this.name = name; }
    }
    static User[] activeUsers() {
        return new User[] {new User("001", "가람"), new User("002", "나래")};
    }
    static void currentCheck() {
        User[] result = activeUsers();
        if (result == null || result.length != 2) throw new AssertionError("활성 사용자 조회");
    }
    public static void main(String[] args) {
        currentCheck();
        System.out.println("현재 시험 통과");
    }
}
