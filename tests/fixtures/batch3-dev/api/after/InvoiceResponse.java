package sample;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
public record InvoiceResponse(@JsonAlias("label") String title, @JsonProperty("account_code") String code) {}
