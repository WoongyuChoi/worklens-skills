package sample;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
public class SaveInvoice {
    @JsonProperty(required = true)
    public String memo;
    public int priority;
    @NotNull
    public String costCenter;
}
