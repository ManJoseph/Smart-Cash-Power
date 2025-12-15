package smartcashpower.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smartcashpower.app.model.Meter;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeterDetailDTO {
    private Long id;
    private String meterNumber;
    private Float currentUnits;
    private Boolean active;
    private String ownerEmail;
    private String ownerFullName;

    public static MeterDetailDTO fromMeter(Meter meter) {
        if (meter == null) {
            return null;
        }
        return new MeterDetailDTO(
                meter.getId(),
                meter.getMeterNumber(),
                meter.getCurrentUnits(),
                meter.getActive(),
                meter.getUser() != null ? meter.getUser().getEmail() : "N/A",
                meter.getUser() != null ? meter.getUser().getFullName() : "N/A"
        );
    }
}
