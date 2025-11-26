package smartcashpower.app.service;

import smartcashpower.app.dto.UserDetailedResponse;
import smartcashpower.app.model.Admin;
import smartcashpower.app.model.Meter;
import smartcashpower.app.model.Transaction;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

// Assuming User and Meter models exist in com.smartcashpower.app.model
// Assuming User has fields: id, username, email, fullName, phoneNumber, createdAt, isActive
// Assuming Meter has a relationship to User or a userId field

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final MeterRepository meterRepository;
    private final AdminRepository adminRepository;

    @Autowired
    public AdminService(UserRepository userRepository,
                        TransactionRepository transactionRepository,
                        MeterRepository meterRepository,
                        AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.meterRepository = meterRepository;
        this.adminRepository = adminRepository;
    }

    // FR 10: Get all users with their meter count for admin view
    @Transactional(readOnly = true)
    public List<UserDetailedResponse> getAllUsersWithMeterCount() {
        return userRepository.findAll().stream().map(user -> {
            long meterCount = meterRepository.findByUser(user).size();
            UserDetailedResponse dto = new UserDetailedResponse();
            dto.setId(user.getId().intValue());
            dto.setUsername(user.getEmail()); // Using email as username
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setCreatedAt(user.getCreatedAt());
            dto.setActive(user.isActive());
            dto.setMeterCount(meterCount);
            return dto;
        }).collect(Collectors.toList());
    }

    // FR 11, 12: Retrieve transactions by date range for reporting
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return transactionRepository.findAll().stream()
                .filter(tx -> tx.getTransactionDate() != null 
                        && !tx.getTransactionDate().isBefore(startDate) 
                        && !tx.getTransactionDate().isAfter(endDate))
                .collect(Collectors.toList());
    }

    // FR 13: Log administrative actions (simplified - just console log for now)
    public void logAdminAction(int adminId, String action, String targetEntity, String targetId) {
        // Simplified logging - in production, this would write to an audit log table
        System.out.println(String.format("Admin Action: Admin %d performed '%s' on %s %s at %s", 
                adminId, action, targetEntity, targetId, LocalDateTime.now()));
    }

    // FR 10: User suspension and log the action
    @Transactional
    public void blockUser(int userId, int adminId) {
        User user = userRepository.findById((long) userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setActive(false);
        userRepository.save(user);
        logAdminAction(adminId, "Blocked User", "User", String.valueOf(userId));
        System.out.println("User " + userId + " blocked by Admin " + adminId);
    }

    @Transactional
    public void deleteUser(int userId, int adminId) {
        userRepository.deleteById((long) userId);
        logAdminAction(adminId, "Deleted User", "User", String.valueOf(userId));
    }

    @Transactional(readOnly = true)
    public List<Meter> getAllMeters() {
        return meterRepository.findAll();
    }

    @Transactional
    public void deleteMeter(long meterId, int adminId) {
        meterRepository.deleteById(meterId);
        logAdminAction(adminId, "Deleted Meter", "Meter", String.valueOf(meterId));
    }

    @Transactional
    public void approvePasswordReset(int userId, int adminId) {
        User user = userRepository.findById((long) userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setPasswordResetAllowedUntil(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);
        logAdminAction(adminId, "Approved Password Reset", "User", String.valueOf(userId));
    }
}
