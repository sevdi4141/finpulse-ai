package com.finpulse.backend.repository;

import com.finpulse.backend.model.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<FinancialTransaction, Long> {
    List<FinancialTransaction> findAllByOrderByTransactionDateDesc();
}
