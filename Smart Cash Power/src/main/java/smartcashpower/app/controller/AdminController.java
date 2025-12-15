package smartcashpower.app.controller;

import smartcashpower.app.dto.UserDetailedResponse;
import smartcashpower.app.service.AdminService;
import smartcashpower.app.dto.TransactionDetailDTO;
import smartcashpower.app.dto.MeterDetailDTO;
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

    @GetMapping("/users")
    public ResponseEntity<List<UserDetailedResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/reports/transactions")
    public ResponseEntity<List<TransactionDetailDTO>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(adminService.getTransactionsByDateRange(startDate, endDate));
    }

    @PostMapping("/users/{userId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable int userId) {
        adminService.blockUser(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable int userId) {
        adminService.unblockUser(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/meters")
    public ResponseEntity<List<MeterDetailDTO>> getAllMeters() {
        return ResponseEntity.ok(adminService.getAllMeters());
    }

    @DeleteMapping("/meters/{meterId}")
    public ResponseEntity<Void> deleteMeter(@PathVariable long meterId) {
        adminService.deleteMeter(meterId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/password-resets")
    public ResponseEntity<List<UserDetailedResponse>> getPendingPasswordResets() {
        return ResponseEntity.ok(adminService.getPendingPasswordResets());
    }

    @PostMapping("/password-resets/{userId}/approve")
    public ResponseEntity<Void> approvePasswordReset(@PathVariable int userId) {
        adminService.approvePasswordReset(userId);
        return ResponseEntity.ok().build();
    }
}
