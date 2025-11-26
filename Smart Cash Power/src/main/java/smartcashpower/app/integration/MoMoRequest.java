package smartcashpower.app.integration;

import lombok.Data;

@Data
public class MoMoRequest {
    private String phoneNumber;
    private float amount;
    private String transactionReference;
}
