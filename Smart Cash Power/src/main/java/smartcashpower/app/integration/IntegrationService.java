package smartcashpower.app.integration;

import org.springframework.stereotype.Service;

@Service
public class IntegrationService {

    public MoMoResponse verifyMoMoPayment(MoMoRequest request) {
        // Mock implementation
        MoMoResponse response = new MoMoResponse();
        // Simulate success most of the time
        if (Math.random() > 0.1) { // 90% success rate
            response.setSuccessful(true);
            response.setMessage("Payment successful");
        } else {
            response.setSuccessful(false);
            response.setMessage("Payment failed at MoMo provider");
        }
        return response;
    }

    public REGUnitLoadResponse loadUnitsToMeter(REGUnitLoadRequest request) {
        // Mock implementation
        REGUnitLoadResponse response = new REGUnitLoadResponse();
        // Simulate success most of the time
        if (Math.random() > 0.05) { // 95% success rate
            response.setSuccessful(true);
            response.setMessage("Units loaded successfully");
        } else {
            response.setSuccessful(false);
            response.setMessage("Failed to load units at REG");
        }
        return response;
    }
}
