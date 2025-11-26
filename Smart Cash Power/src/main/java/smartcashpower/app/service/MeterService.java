package smartcashpower.app.service;

import smartcashpower.app.model.Meter;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.MeterRepository;
import smartcashpower.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MeterService {

    private final MeterRepository meterRepository;
    private final UserRepository userRepository;

    @Autowired
    public MeterService(MeterRepository meterRepository, UserRepository userRepository) {
        this.meterRepository = meterRepository;
        this.userRepository = userRepository;
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
}
