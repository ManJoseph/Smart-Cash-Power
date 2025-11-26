package smartcashpower.app.repository;

import smartcashpower.app.model.Transaction;
import smartcashpower.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Integer> {

    /**
     * Finds all transactions for a specific user, ordered by transaction date in descending order.
     *
     * @param user the user to find transactions for
     * @return a list of transactions belonging to the user, ordered by transaction date descending
     */
    List<Transaction> findByUserOrderByTransactionDateDesc(User user);
}
