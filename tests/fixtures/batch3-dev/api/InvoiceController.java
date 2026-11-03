package sample;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/invoices")
class InvoiceController {
    private final InvoiceService service;
    InvoiceController(InvoiceService service) { this.service = service; }
    @GetMapping("/{id}")
    InvoiceResponse get(@PathVariable String id) { return service.get(id); }
    @PostMapping
    void save(@Valid @RequestBody SaveInvoice request) { service.save(request); }
}
