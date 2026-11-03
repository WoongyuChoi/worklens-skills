import java.math.BigDecimal;
import java.math.RoundingMode;

/** 합성 업무 코드. 실제 승인된 수수료 정책을 뜻하지 않습니다. */
public final class LegacyFee {
    public static BigDecimal fee(String amount, String rate) {
        BigDecimal base = new BigDecimal(amount);
        if (base.signum() < 0) throw new IllegalArgumentException("금액은 음수일 수 없습니다");
        return base.multiply(new BigDecimal(rate)).setScale(0, RoundingMode.DOWN);
    }
    public static void main(String[] args) {
        if (args.length != 2) throw new IllegalArgumentException("금액과 요율을 입력하세요");
        System.out.println(fee(args[0], args[1]).toPlainString());
    }
}
