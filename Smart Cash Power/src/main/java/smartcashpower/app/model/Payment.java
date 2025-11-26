package smartcashpower.app.model;

import lombok.Data;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentId;

    @OneToOne
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    private String providerName; // Mock for MobileMoneyProvider
    private String paymentReference;
    private String paymentStatus; // PENDING, SUCCESS, FAILED
    private LocalDateTime paymentDate;
    private String confirmationCode;
    private String responseMessage;
}
