package smartcashpower.app.model;

import lombok.Data;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer transactionId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    private Float amount;
    private Float unitsPurchased;
    private LocalDateTime transactionDate;
    private String status; // PENDING, SUCCESS, FAILED
    private String transactionReference;

    @OneToOne(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;
}
