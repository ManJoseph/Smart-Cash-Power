package smartcashpower.app.service;

import smartcashpower.app.model.User;
import smartcashpower.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user in the system.
     *
     * @param user the user to register
     * @return the registered user
     * @throws IllegalArgumentException if a user with the same email or phone number already exists
     */
    public User registerUser(User user) {
        // Check if user with the same email or phone number already exists
        if (userRepository.findByEmailOrPhoneNumber(user.getEmail(), user.getPhoneNumber()).isPresent()) {
            throw new IllegalArgumentException("User with the same email or phone number already exists.");
        }

        // Encode the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Set default role
        user.setRole("USER");

        // Save the user
        return userRepository.save(user);
    }

    /**
     * Finds a user by their email address.
     *
     * @param email the email address to search for
     * @return an Optional containing the user if found, or an empty Optional if not
     */
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Authenticates a user by email and password.
     *
     * @param email the email address
     * @param password the plain text password
     * @return the authenticated user if credentials are valid, null otherwise
     */
    public User authenticateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                return user;
            }
        }
        return null;
    }
}
