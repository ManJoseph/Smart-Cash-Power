package smartcashpower.app.controller;

import smartcashpower.app.dto.TransactionInitiationRequest;
import smartcashpower.app.dto.TransactionResponse;
import smartcashpower.app.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    private Integer getCurrentUserId() {
        // Mock implementation for now
        return 1;
    }

    @PostMapping("/purchase")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse initiatePurchase(@RequestBody TransactionInitiationRequest request) {
        return transactionService.initiatePurchase(getCurrentUserId(), request);
    }

    @GetMapping("/history")
    public List<TransactionResponse> getTransactionHistory() {
        return transactionService.getTransactionHistory(getCurrentUserId());
    }
}
