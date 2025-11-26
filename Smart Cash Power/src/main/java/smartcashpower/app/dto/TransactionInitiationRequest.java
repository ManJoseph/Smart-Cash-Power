package smartcashpower.app.dto;

import lombok.Data;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class TransactionInitiationRequest {

    @NotNull(message = "Meter ID cannot be null")
    private Integer meterId;

    @NotNull(message = "Amount cannot be null")
    @Min(value = 100, message = "Minimum purchase amount is 100")
    private Integer amount;

    @NotNull(message = "Mobile Money Provider cannot be null")
    private String mobileMoneyProvider;
}
