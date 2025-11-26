package smartcashpower.app.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {

    private Long userId;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String role;
    private LocalDateTime createdAt;
}
