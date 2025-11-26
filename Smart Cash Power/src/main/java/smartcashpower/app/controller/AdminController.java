package smartcashpower.app.controller;

import smartcashpower.app.dto.UserDetailedResponse;
import smartcashpower.app.model.Meter;
import smartcashpower.app.model.Transaction;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.UserRepository;
import smartcashpower.app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    @Autowired
    public AdminController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_ADMIN".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private int getCurrentAdminId(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Unauthenticated access");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated admin not found with email: " + email));
        return user.getId().intValue();
    }

    // FR 10: Get all users with their meter count
    @GetMapping("/users")
    public ResponseEntity<List<UserDetailedResponse>> getAllUsersWithMeterCount(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        List<UserDetailedResponse> users = adminService.getAllUsersWithMeterCount();
        adminService.logAdminAction(getCurrentAdminId(authentication), "Viewed All Users", "User", "N/A");
        return ResponseEntity.ok(users);
    }

    // FR 11, 12: Retrieve transactions by date range for reporting
    @GetMapping("/reports/transactions")
    public ResponseEntity<List<Transaction>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        List<Transaction> transactions = adminService.getTransactionsByDateRange(startDate, endDate);
        adminService.logAdminAction(getCurrentAdminId(authentication), "Viewed Transactions Report", "Transaction", "Date Range: " + startDate + " to " + endDate);
        return ResponseEntity.ok(transactions);
    }

    // FR 10: Block a user
    @PostMapping("/users/{userId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable int userId, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        adminService.blockUser(userId, getCurrentAdminId(authentication));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable int userId, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        adminService.deleteUser(userId, getCurrentAdminId(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/meters")
    public ResponseEntity<List<Meter>> getAllMeters(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(adminService.getAllMeters());
    }

    @DeleteMapping("/meters/{meterId}")
    public ResponseEntity<Void> deleteMeter(@PathVariable long meterId, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        adminService.deleteMeter(meterId, getCurrentAdminId(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password-resets/{userId}/approve")
    public ResponseEntity<Void> approvePasswordReset(@PathVariable int userId, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        adminService.approvePasswordReset(userId, getCurrentAdminId(authentication));
        return ResponseEntity.ok().build();
    }
}
