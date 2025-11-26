package smartcashpower.app.controller;

import smartcashpower.app.dto.TransactionInitiationRequest;
import smartcashpower.app.dto.TransactionResponse;
import smartcashpower.app.model.User;
import smartcashpower.app.repository.UserRepository;
import smartcashpower.app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;

    @Autowired
    public TransactionController(TransactionService transactionService, UserRepository userRepository) {
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    private Integer getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found with email: " + email));
        return user.getId().intValue();
    }

    @PostMapping("/purchase")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse initiatePurchase(@RequestBody TransactionInitiationRequest request, Authentication authentication) {
        return transactionService.initiatePurchase(getCurrentUserId(authentication), request);
    }

    @GetMapping("/history")
    public List<TransactionResponse> getTransactionHistory(Authentication authentication) {
        return transactionService.getTransactionHistory(getCurrentUserId(authentication));
    }
}
