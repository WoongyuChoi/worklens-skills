package sample;

@RestController
@RequestMapping("/api/protected-records")
class ProtectedRecordController {
    private final RecordRepository records;

    @GetMapping("/{recordId}")
    @PreAuthorize("hasAuthority('RECORD_READ')")
    CustomerRecord getRecord(@PathVariable String recordId, @AuthenticationPrincipal StaffPrincipal principal) {
        return records.findByIdAndOwnerIdAndOrganizationId(
            recordId, principal.staffId(), principal.organizationId()).orElseThrow();
    }
}
