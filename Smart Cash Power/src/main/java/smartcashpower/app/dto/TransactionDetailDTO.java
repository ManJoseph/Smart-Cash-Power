package smartcashpower.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smartcashpower.app.model.Transaction;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDetailDTO {
    private Integer transactionId;
    private String userEmail;
    private String userFullName;
    private String meterNumber;
    private Float amountPaid;
    private Float unitsPurchased;
    private LocalDateTime transactionDate;
    private String status;
    private String transactionReference;

    public static TransactionDetailDTO fromTransaction(Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        return new TransactionDetailDTO(
                transaction.getTransactionId(),
                transaction.getUser() != null ? transaction.getUser().getEmail() : "N/A",
                transaction.getUser() != null ? transaction.getUser().getFullName() : "N/A",
                transaction.getMeter() != null ? transaction.getMeter().getMeterNumber() : "N/A",
                transaction.getAmount(),
                transaction.getUnitsPurchased(),
                transaction.getTransactionDate(),
                transaction.getStatus(),
                transaction.getTransactionReference()
        );
    }
}
