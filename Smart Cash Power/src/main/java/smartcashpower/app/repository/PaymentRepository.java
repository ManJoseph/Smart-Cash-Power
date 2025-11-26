package smartcashpower.app.repository;

import smartcashpower.app.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    /**
     * Finds a payment by its unique payment reference.
     *
     * @param paymentReference the payment reference to search for
     * @return an Optional containing the payment if found, or an empty Optional if not
     */
    Optional<Payment> findByPaymentReference(String paymentReference);
}
