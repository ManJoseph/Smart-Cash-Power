package smartcashpower.app.service;

import smartcashpower.app.dto.TransactionInitiationRequest;
import smartcashpower.app.dto.TransactionResponse;
import smartcashpower.app.integration.IntegrationService;
import smartcashpower.app.integration.MoMoRequest;
import smartcashpower.app.integration.MoMoResponse;
import smartcashpower.app.integration.REGUnitLoadRequest;
import smartcashpower.app.integration.REGUnitLoadResponse;
import smartcashpower.app.model.Meter;
import smartcashpower.app.model.Payment;
import smartcashpower.app.model.Transaction;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.MeterRepository;
import smartcashpower.app.repository.PaymentRepository;
import smartcashpower.app.repository.TransactionRepository;
import smartcashpower.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final MeterRepository meterRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;
    private final IntegrationService integrationService;
    private final UserRepository userRepository;

    private static final float RWF_PER_UNIT = 100.0f;

    @Autowired
    public TransactionService(MeterRepository meterRepository, TransactionRepository transactionRepository,
                              PaymentRepository paymentRepository, IntegrationService integrationService,
                              UserRepository userRepository) {
        this.meterRepository = meterRepository;
        this.transactionRepository = transactionRepository;
        this.paymentRepository = paymentRepository;
        this.integrationService = integrationService;
        this.userRepository = userRepository;
    }

    @Transactional
    public TransactionResponse initiatePurchase(Integer userId, TransactionInitiationRequest request) {
        User user = userRepository.findById(userId.longValue())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Meter meter = meterRepository.findById(request.getMeterId().longValue())
                .orElseThrow(() -> new RuntimeException("Meter not found with id: " + request.getMeterId()));

        float unitsPurchased = request.getAmount().floatValue() / RWF_PER_UNIT;
        String transactionReference = UUID.randomUUID().toString();

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setMeter(meter);
        transaction.setAmount(request.getAmount().floatValue());
        transaction.setUnitsPurchased(unitsPurchased);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setStatus("PENDING");
        transaction.setTransactionReference(transactionReference);

        Payment payment = new Payment();
        payment.setTransaction(transaction);
        payment.setProviderName(request.getMobileMoneyProvider());
        payment.setPaymentReference("PAY-" + transactionReference);
        payment.setPaymentStatus("PENDING");
        payment.setPaymentDate(LocalDateTime.now());

        transaction.setPayment(payment);
        transactionRepository.save(transaction);

        MoMoRequest moMoRequest = new MoMoRequest();
        moMoRequest.setPhoneNumber(user.getPhoneNumber());
        moMoRequest.setAmount(request.getAmount().floatValue());
        moMoRequest.setTransactionReference(payment.getPaymentReference());

        MoMoResponse moMoResponse = integrationService.verifyMoMoPayment(moMoRequest);

        if (moMoResponse.isSuccessful()) {
            payment.setPaymentStatus("COMPLETED");
            payment.setConfirmationCode(UUID.randomUUID().toString()); // Mock confirmation
            payment.setResponseMessage(moMoResponse.getMessage());
            paymentRepository.save(payment);

            REGUnitLoadRequest regRequest = new REGUnitLoadRequest();
            regRequest.setMeterNumber(meter.getMeterNumber());
            regRequest.setUnits(unitsPurchased);

            REGUnitLoadResponse regResponse = integrationService.loadUnitsToMeter(regRequest);

            if (regResponse.isSuccessful()) {
                meter.setCurrentUnits(meter.getCurrentUnits() + unitsPurchased);
                meterRepository.save(meter);
                transaction.setStatus("SUCCESS");
            } else {
                transaction.setStatus("REG_FAILED");
            }
        } else {
            transaction.setStatus("FAILED");
            payment.setPaymentStatus("FAILED");
            payment.setResponseMessage(moMoResponse.getMessage());
            paymentRepository.save(payment);
        }

        transactionRepository.save(transaction);
        return new TransactionResponse(transaction);
    }

    public List<TransactionResponse> getTransactionHistory(Integer userId) {
        User user = userRepository.findById(userId.longValue())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return transactionRepository.findByUserOrderByTransactionDateDesc(user)
                .stream()
                .map(TransactionResponse::new)
                .collect(Collectors.toList());
    }
}
