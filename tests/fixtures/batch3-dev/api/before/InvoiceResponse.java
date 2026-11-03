package sample;
import com.fasterxml.jackson.annotation.JsonProperty;
public record InvoiceResponse(String label, @JsonProperty("account_code") String accountCode) {}
