package smartcashpower.app.integration;

import lombok.Data;

@Data
public class REGUnitLoadRequest {
    private String meterNumber;
    private double units;
}
