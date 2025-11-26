package smartcashpower.app.controller;

import smartcashpower.app.dto.UserRegistrationRequest;
import smartcashpower.app.dto.UserResponse;
import smartcashpower.app.model.User;
import smartcashpower.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
