import org.springframework.transaction.annotation.*;
class CheckoutService {
    private final RowStore orders;
    private final RowStore localEvents;
    private final InventoryService inventory;
    private final AuditService audit;
    CheckoutService(RowStore orders, RowStore localEvents, InventoryService inventory, AuditService audit) {
        this.orders = orders; this.localEvents = localEvents; this.inventory = inventory; this.audit = audit;
    }
    @Transactional
    public void place() {
        orders.insert("ORDER-7");
        try { inventory.reserve(); }
        catch (IllegalStateException ex) { System.out.println("재고 처리 실패 기록"); }
        audit.record();
        this.localRecord();
        System.out.println("주문 메서드 종료");
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void localRecord() { localEvents.insert("LOCAL-7"); }
}
