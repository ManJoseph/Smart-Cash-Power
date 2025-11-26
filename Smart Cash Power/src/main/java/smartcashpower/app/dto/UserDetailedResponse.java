package smartcashpower.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailedResponse {
    private int id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private boolean isActive;
    private long meterCount; // To include the count of registered Meters
}
