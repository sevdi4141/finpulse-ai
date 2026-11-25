package com.finpulse.backend.controller;

import com.finpulse.backend.model.FinancialTransaction;
import com.finpulse.backend.service.FinanceService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "*")
public class FinanceController {
    private final FinanceService service;

    public FinanceController(FinanceService service) {
        this.service = service;
    }

    @GetMapping("/transactions")
    public List<FinancialTransaction> getAll() {
        return service.getAllTransactions();
    }

    @PostMapping("/transactions")
    public FinancialTransaction create(@RequestBody FinancialTransaction transaction) {
        return service.addTransaction(transaction);
    }

    @DeleteMapping("/transactions/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteTransaction(id);
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        return service.getFinancialSummary();
    }
}
