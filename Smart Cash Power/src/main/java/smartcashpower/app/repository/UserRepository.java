package smartcashpower.app.repository;

import smartcashpower.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     *
     * @param email the email address to search for
     * @return an Optional containing the user if found, or an empty Optional if not
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their phone number.
     *
     * @param phoneNumber the phone number to search for
     * @return an Optional containing the user if found, or an empty Optional if not
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Finds a user by their email address or phone number.
     *
     * @param email the email address to search for
     * @param phoneNumber the phone number to search for
     * @return an Optional containing the user if found, or an empty Optional if not
     */
    Optional<User> findByEmailOrPhoneNumber(String email, String phoneNumber);
}
