package smartcashpower.app.dto;

import smartcashpower.app.model.Transaction;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TransactionResponse {

    private Integer transactionId;
    private String meterNumber;
    private Float amountPaid;
    private Float unitsPurchased;
    private String currentStatus;
    private LocalDateTime transactionDate;
    private String referenceNumber;

    public TransactionResponse(Transaction transaction) {
        this.transactionId = transaction.getTransactionId();
        // Assuming Meter is eagerly fetched or accessible, and Transaction has a getMeter() method
        this.meterNumber = transaction.getMeter() != null ? transaction.getMeter().getMeterNumber() : null;
        this.amountPaid = transaction.getAmount();
        this.unitsPurchased = transaction.getUnitsPurchased();
        this.currentStatus = transaction.getStatus();
        this.transactionDate = transaction.getTransactionDate();
        this.referenceNumber = transaction.getTransactionReference();
    }
}
