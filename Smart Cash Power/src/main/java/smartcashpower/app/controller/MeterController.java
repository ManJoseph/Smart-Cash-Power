package smartcashpower.app.controller;

import smartcashpower.app.dto.AddMeterRequest;
import smartcashpower.app.model.Meter;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.UserRepository;
import smartcashpower.app.service.MeterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meters")
public class MeterController {

    private final MeterService meterService;
    private final UserRepository userRepository;

    @Autowired
    public MeterController(MeterService meterService, UserRepository userRepository) {
        this.meterService = meterService;
        this.userRepository = userRepository;
    }

    private Integer getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + email));
        return user.getId().intValue();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void addMeter(@RequestBody AddMeterRequest request, Authentication authentication) {
        meterService.addMeterToUser(getCurrentUserId(authentication), request.getMeterNumber());
    }

    @GetMapping
    public List<Meter> getUserMeters(Authentication authentication) {
        return meterService.getUserMeters(getCurrentUserId(authentication));
    }

    @DeleteMapping("/{meterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMeter(@PathVariable Long meterId, Authentication authentication) {
        meterService.deleteMeter(getCurrentUserId(authentication), meterId);
    }

    @PutMapping("/{meterId}/units")
    @ResponseStatus(HttpStatus.OK)
    public void updateMeterUnits(@PathVariable Long meterId, @RequestBody smartcashpower.app.dto.UpdateUnitsRequest request) {
        meterService.updateMeterUnits(meterId, request.getCurrentUnits(), request.getUsedUnits());
    }
}
