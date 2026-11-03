import org.springframework.transaction.annotation.*;
class AuditService {
    private final RowStore auditRows;
    AuditService(RowStore auditRows) { this.auditRows = auditRows; }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record() { auditRows.insert("AUDIT-7"); }
}
