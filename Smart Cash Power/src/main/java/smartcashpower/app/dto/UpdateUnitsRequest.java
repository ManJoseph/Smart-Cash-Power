package smartcashpower.app.dto;

public class UpdateUnitsRequest {
    private Float currentUnits;
    private Float usedUnits;

    // Getters and Setters
    public Float getCurrentUnits() {
        return currentUnits;
    }

    public void setCurrentUnits(Float currentUnits) {
        this.currentUnits = currentUnits;
    }

    public Float getUsedUnits() {
        return usedUnits;
    }

    public void setUsedUnits(Float usedUnits) {
        this.usedUnits = usedUnits;
    }
}
