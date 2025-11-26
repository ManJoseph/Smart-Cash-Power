package smartcashpower.app.controller;

import smartcashpower.app.dto.AddMeterRequest;
import smartcashpower.app.model.Meter;
import smartcashpower.app.service.MeterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meters")
public class MeterController {

    private final MeterService meterService;

    @Autowired
    public MeterController(MeterService meterService) {
        this.meterService = meterService;
    }

    private Integer getCurrentUserId() {
        // Mock implementation for now
        return 1;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void addMeter(@RequestBody AddMeterRequest request) {
        meterService.addMeterToUser(getCurrentUserId(), request.getMeterNumber());
    }

    @GetMapping
    public List<Meter> getUserMeters() {
        return meterService.getUserMeters(getCurrentUserId());
    }
}
