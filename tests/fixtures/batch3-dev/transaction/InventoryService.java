import org.springframework.transaction.annotation.Transactional;
class InventoryService {
    private final RowStore reservations;
    InventoryService(RowStore reservations) { this.reservations = reservations; }
    @Transactional
    public void reserve() {
        reservations.insert("STOCK-7");
        throw new IllegalStateException("재고 예약 실패");
    }
}
