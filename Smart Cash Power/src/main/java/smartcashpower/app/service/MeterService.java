package smartcashpower.app.service;

import smartcashpower.app.model.Meter;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.MeterRepository;
import smartcashpower.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import smartcashpower.app.model.Transaction;
import smartcashpower.app.repository.PaymentRepository;
import smartcashpower.app.repository.TransactionRepository;
import org.springframework.transaction.annotation.Transactional;
import smartcashpower.app.exception.ResourceNotFoundException;
import java.nio.file.AccessDeniedException;


@Service
public class MeterService {

    private final MeterRepository meterRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;

    @Autowired
    public MeterService(MeterRepository meterRepository, UserRepository userRepository, TransactionRepository transactionRepository, PaymentRepository paymentRepository) {
        this.meterRepository = meterRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.paymentRepository = paymentRepository;
    }

    public Meter addMeterToUser(Integer userId, String meterNumber) {
        User user = userRepository.findById(userId.longValue())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (meterRepository.findByMeterNumber(meterNumber).isPresent()) {
            throw new IllegalArgumentException("Meter with number " + meterNumber + " already exists.");
        }

        Meter newMeter = new Meter();
        newMeter.setMeterNumber(meterNumber);
        newMeter.setCurrentUnits(0.0f);
        newMeter.setUsedUnits(0.0f);
        newMeter.setActive(true);
        newMeter.setUser(user);

        return meterRepository.save(newMeter);
    }

    public List<Meter> getUserMeters(Integer userId) {
        User user = userRepository.findById(userId.longValue())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return meterRepository.findByUser(user);
    }

    @Transactional
    public void deleteMeter(Integer userId, Long meterId) {
        User user = userRepository.findById(userId.longValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Meter meter = meterRepository.findById(meterId)
                .orElseThrow(() -> new ResourceNotFoundException("Meter not found with id: " + meterId));

        if (!meter.getUser().getId().equals(user.getId())) {
            throw new SecurityException("User does not have permission to delete this meter.");
        }

        List<Transaction> transactions = transactionRepository.findByMeter(meter);
        for (Transaction tx : transactions) {
            if (tx.getPayment() != null) {
                paymentRepository.delete(tx.getPayment());
            }
        }
        transactionRepository.deleteAll(transactions);

        meterRepository.delete(meter);
    }

    public void updateMeterUnits(Long meterId, Float currentUnits, Float usedUnits) {
        Meter meter = meterRepository.findById(meterId)
                .orElseThrow(() -> new RuntimeException("Meter not found with id: " + meterId));
        meter.setCurrentUnits(currentUnits);
        meter.setUsedUnits(usedUnits);
        meterRepository.save(meter);
    }
}
