package smartcashpower.app.controller;

import smartcashpower.app.dto.UserRegistrationRequest;
import smartcashpower.app.dto.UserResponse;
import smartcashpower.app.model.User;
import smartcashpower.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@RequestBody UserRegistrationRequest registrationRequest) {
        User newUser = new User();
        newUser.setEmail(registrationRequest.getEmail());
        newUser.setPassword(registrationRequest.getPassword());
        newUser.setPhoneNumber(registrationRequest.getPhoneNumber());
        newUser.setFullName(registrationRequest.getFullName());

        User registeredUser = userService.registerUser(newUser);

        UserResponse response = new UserResponse();
        response.setUserId(registeredUser.getId());
        response.setEmail(registeredUser.getEmail());
        response.setPhoneNumber(registeredUser.getPhoneNumber());
        response.setFullName(registeredUser.getFullName());
        response.setRole(registeredUser.getRole());
        response.setCreatedAt(registeredUser.getCreatedAt());

        return response;
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        try {
            User user = userService.authenticateUser(loginRequest.getEmail(), loginRequest.getPassword());
            if (user != null) {
                // In a real app, you'd generate a JWT token here
                // For now, we'll return user data
                UserResponse response = new UserResponse();
                response.setUserId(user.getId());
                response.setEmail(user.getEmail());
                response.setPhoneNumber(user.getPhoneNumber());
                response.setFullName(user.getFullName());
                response.setRole(user.getRole());
                response.setCreatedAt(user.getCreatedAt());
                
                // Mock token - in production, use JWT
                String mockToken = "mock-jwt-token-" + user.getId();
                
                return ResponseEntity.ok().body(new LoginResponse(mockToken, response));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody UserRegistrationRequest request, Authentication authentication) {
        String email = authentication.getName();
        User current = userService.findUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        User updated = userService.updateProfile(current.getId(), request.getFullName(), request.getPhoneNumber());

        UserResponse response = new UserResponse();
        response.setUserId(updated.getId());
        response.setEmail(updated.getEmail());
        response.setPhoneNumber(updated.getPhoneNumber());
        response.setFullName(updated.getFullName());
        response.setRole(updated.getRole());
        response.setCreatedAt(updated.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
        String email = authentication.getName();
        User current = userService.findUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        userService.changePassword(current.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        userService.requestPasswordReset(request.getEmail());
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/reset-status")
    public ResponseEntity<ResetStatusResponse> getResetStatus(@RequestParam String email) {
        boolean allowed = userService.isResetWindowOpen(email);
        return ResponseEntity.ok(new ResetStatusResponse(allowed));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPasswordWithWindow(request.getEmail(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
    
    // Inner classes for login request/response
    private static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    private static class LoginResponse {
        private String token;
        private UserResponse user;
        
        public LoginResponse(String token, UserResponse user) {
            this.token = token;
            this.user = user;
        }
        
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public UserResponse getUser() { return user; }
        public void setUser(UserResponse user) { this.user = user; }
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() {
            return currentPassword;
        }

        public void setCurrentPassword(String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class ForgotPasswordRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class ResetPasswordRequest {
        private String email;
        private String newPassword;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class ResetStatusResponse {
        private boolean allowed;

        public ResetStatusResponse(boolean allowed) {
            this.allowed = allowed;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public void setAllowed(boolean allowed) {
            this.allowed = allowed;
        }
    }
}
