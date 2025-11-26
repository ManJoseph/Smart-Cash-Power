package smartcashpower.app.controller;

import smartcashpower.app.dto.UserDetailedResponse;
import smartcashpower.app.model.Transaction;
import smartcashpower.app.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // Mock method to get current authenticated admin ID
    // In a real application, this would come from Spring Security context
    private int getCurrentAdminId() {
        return 999; // Mock Admin ID
    }

    // Mock method to check current authenticated user's role
    // In a real application, this would come from Spring Security context
    private String getCurrentUserRole() {
        return "ADMIN"; // Mock Admin Role
    }

    // FR 10: Get all users with their meter count
    @GetMapping("/users")
    public ResponseEntity<List<UserDetailedResponse>> getAllUsersWithMeterCount() {
        if (!getCurrentUserRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        List<UserDetailedResponse> users = adminService.getAllUsersWithMeterCount();
        adminService.logAdminAction(getCurrentAdminId(), "Viewed All Users", "User", "N/A");
        return ResponseEntity.ok(users);
    }

    // FR 11, 12: Retrieve transactions by date range for reporting
    @GetMapping("/reports/transactions")
    public ResponseEntity<List<Transaction>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        if (!getCurrentUserRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        List<Transaction> transactions = adminService.getTransactionsByDateRange(startDate, endDate);
        adminService.logAdminAction(getCurrentAdminId(), "Viewed Transactions Report", "Transaction", "Date Range: " + startDate + " to " + endDate);
        return ResponseEntity.ok(transactions);
    }

    // FR 10: Block a user
    @PostMapping("/users/{userId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable int userId) {
        if (!getCurrentUserRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        adminService.blockUser(userId, getCurrentAdminId());
        return ResponseEntity.ok().build();
    }
}
