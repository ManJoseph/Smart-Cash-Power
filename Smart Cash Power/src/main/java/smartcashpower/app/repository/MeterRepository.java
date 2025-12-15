package smartcashpower.app.repository;

import smartcashpower.app.model.Meter;
import smartcashpower.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeterRepository extends JpaRepository<Meter, Long> {

    /**
     * Finds a meter by its unique meter number.
     *
     * @param meterNumber the meter number to search for
     * @return an Optional containing the meter if found, or an empty Optional if not
     */
    Optional<Meter> findByMeterNumber(String meterNumber);

    /**
     * Finds all meters associated with a specific user.
     *
     * @param user the user to find meters for
     * @return a list of meters belonging to the user
     */
    List<Meter> findByUser(User user);

    @Query("SELECT m FROM Meter m JOIN FETCH m.user")
    List<Meter> findAllWithUser();
}
