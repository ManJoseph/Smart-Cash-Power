package smartcashpower.app.service;

import smartcashpower.app.dto.UserDetailedResponse;
import smartcashpower.app.model.Admin;
import smartcashpower.app.model.Meter;
import smartcashpower.app.model.Transaction;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.*;
import smartcashpower.app.exception.ResourceNotFoundException;
import smartcashpower.app.dto.TransactionDetailDTO;
import smartcashpower.app.dto.MeterDetailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final MeterRepository meterRepository;
    private final AdminRepository adminRepository;
    private final PaymentRepository paymentRepository;

    @Autowired
    public AdminService(UserRepository userRepository,
                        TransactionRepository transactionRepository,
                        MeterRepository meterRepository,
                        AdminRepository adminRepository,
                        PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.meterRepository = meterRepository;
        this.adminRepository = adminRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDetailedResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        Map<Long, Long> meterCounts = meterRepository.findAll().stream()
                .filter(meter -> meter.getUser() != null)
                .collect(Collectors.groupingBy(meter -> meter.getUser().getId(), Collectors.counting()));

        return users.stream().map(user -> {
            long meterCount = meterCounts.getOrDefault(user.getId(), 0L);
            UserDetailedResponse dto = new UserDetailedResponse();
            dto.setId(user.getId().intValue());
            dto.setUsername(user.getEmail());
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setCreatedAt(user.getCreatedAt());
            dto.setActive(user.isActive());
            dto.setMeterCount(meterCount);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDetailedResponse> getPendingPasswordResets() {
        return userRepository.findByPasswordResetRequestedAtIsNotNullAndPasswordResetAllowedUntilIsNull().stream()
            .map(user -> {
                UserDetailedResponse dto = new UserDetailedResponse();
                dto.setId(user.getId().intValue());
                dto.setEmail(user.getEmail());
                dto.setFullName(user.getFullName());
                dto.setCreatedAt(user.getPasswordResetRequestedAt());
                return dto;
            }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDetailDTO> getTransactionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return transactionRepository.findAllByTransactionDateBetween(startDate, endDate)
                .stream()
                .map(TransactionDetailDTO::fromTransaction)
                .collect(Collectors.toList());
    }

    public void logAdminAction(int adminId, String action, String targetEntity, String targetId) {
        log.info("Admin Action: Admin {} performed '{}' on {} {} at {}",
                adminId, action, targetEntity, targetId, LocalDateTime.now());
    }

    @Transactional
    public void blockUser(int userId) {
        User user = userRepository.findById((long) userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void unblockUser(int userId) {
        User user = userRepository.findById((long) userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setActive(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        log.info("Attempting to delete user with ID: {}", id);
        
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        
        userRepository.deleteById(id);
        
        log.info("Successfully deleted user with ID: {}", id);
    }

    @Transactional(readOnly = true)
    public List<MeterDetailDTO> getAllMeters() {
        return meterRepository.findAllWithUser().stream()
                .map(MeterDetailDTO::fromMeter)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteMeter(long meterId) {
        Meter meter = meterRepository.findById(meterId)
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found with id: " + meterId));

        // Manually delete associated transactions and payments
        List<Transaction> transactions = transactionRepository.findByMeter(meter);
        for (Transaction tx : transactions) {
            // If there's a payment linked, delete it first.
            if (tx.getPayment() != null) {
                paymentRepository.delete(tx.getPayment());
            }
        }
        // Delete all transactions for the meter
        transactionRepository.deleteAll(transactions);

        // Finally, delete the meter
        meterRepository.delete(meter);
    }

    @Transactional
    public void approvePasswordReset(int userId) {
        User user = userRepository.findById((long) userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setPasswordResetAllowedUntil(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);
    }
}
