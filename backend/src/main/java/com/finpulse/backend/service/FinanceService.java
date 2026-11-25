package com.finpulse.backend.service;

import com.finpulse.backend.model.FinancialTransaction;
import com.finpulse.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FinanceService {
    private final TransactionRepository repository;
    private final Map<String, Double> cachedRates = new HashMap<>();
    private long lastFetchTime = 0;

    public FinanceService(TransactionRepository repository) {
        this.repository = repository;
        cachedRates.put("TRY", 1.0);
        cachedRates.put("USD", 35.50);
        cachedRates.put("EUR", 38.20);
        cachedRates.put("GBP", 45.10);
        cachedRates.put("CHF", 40.30);
        cachedRates.put("JPY", 0.24);
        cachedRates.put("SAR", 9.46);
        cachedRates.put("AED", 9.66);
    }

    public Map<String, Double> getLiveRates() {
        long now = System.currentTimeMillis();
        if (now - lastFetchTime > 300_000) {
            try {
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://open.er-api.com/v6/latest/TRY"))
                        .GET()
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                String body = response.body();

                for (String code : List.of("USD", "EUR", "GBP", "CHF", "JPY", "SAR", "AED")) {
                    Pattern pattern = Pattern.compile("\"" + code + "\":([0-9.]+)");
                    Matcher matcher = pattern.matcher(body);
                    if (matcher.find()) {
                        double val = Double.parseDouble(matcher.group(1));
                        if (val > 0) {
                            cachedRates.put(code, Math.round((1.0 / val) * 10000.0) / 10000.0);
                        }
                    }
                }
                lastFetchTime = now;
            } catch (Exception ignored) {
            }
        }
        return cachedRates;
    }

    public List<FinancialTransaction> getAllTransactions() {
        return repository.findAllByOrderByTransactionDateDesc();
    }

    public FinancialTransaction addTransaction(FinancialTransaction transaction) {
        return repository.save(transaction);
    }

    public void deleteTransaction(Long id) {
        repository.deleteById(id);
    }

    public Map<String, Object> getFinancialSummary() {
        Map<String, Double> rates = getLiveRates();
        List<FinancialTransaction> list = repository.findAll();

        double totalIncome = 0, totalExpense = 0, totalAssets = 0, totalLiabilities = 0, fxExposure = 0;
        Map<String, Double> currencyBreakdown = new LinkedHashMap<>();

        for (FinancialTransaction t : list) {
            String curr = t.getCurrency() != null ? t.getCurrency().toUpperCase() : "TRY";
            double rate = rates.getOrDefault(curr, 1.0);
            double amountInTry = (t.getAmount() != null ? t.getAmount() : 0.0) * rate;

            currencyBreakdown.put(curr, Math.round((currencyBreakdown.getOrDefault(curr, 0.0) + amountInTry) * 100.0) / 100.0);
            if (!"TRY".equals(curr)) fxExposure += amountInTry;

            switch (t.getType().toUpperCase()) {
                case "INCOME" -> totalIncome += amountInTry;
                case "EXPENSE" -> totalExpense += amountInTry;
                case "ASSET" -> totalAssets += amountInTry;
                case "LIABILITY" -> totalLiabilities += amountInTry;
            }
        }

        double netCashFlow = totalIncome - totalExpense;
        double profitMargin = (totalIncome > 0) ? (netCashFlow / totalIncome) * 100 : 0;
        double currentRatio = (totalLiabilities > 0) ? (totalAssets / totalLiabilities) : (totalAssets > 0 ? 99.0 : 0);

        String aiInsight;
        if (totalIncome == 0 && totalExpense == 0) {
            aiInsight = "Canlı kurlar aktif. Analiz için sol taraftan ilk finansal işleminizi ekleyin.";
        } else if (netCashFlow < 0) {
            aiInsight = "KRİTİK UYARI: Giderler gelirleri aşıyor. Nakit akışı negatifte, acil maliyet kesintisi önerilir.";
        } else if (profitMargin < 15) {
            aiInsight = "DİKKAT: Kâr marjı %15 sınırının altında. Operasyonel giderleri ve döviz riskini optimize edin.";
        } else {
            aiInsight = "SAĞLIKLI BÜYÜME: Nakit akışı pozitif, likidite ve kârlılık rasyoları kurumsal hedefin üzerinde.";
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalIncome", Math.round(totalIncome * 100.0) / 100.0);
        summary.put("totalExpense", Math.round(totalExpense * 100.0) / 100.0);
        summary.put("netCashFlow", Math.round(netCashFlow * 100.0) / 100.0);
        summary.put("profitMargin", Math.round(profitMargin * 100.0) / 100.0);
        summary.put("currentRatio", Math.round(currentRatio * 100.0) / 100.0);
        summary.put("fxExposure", Math.round(fxExposure * 100.0) / 100.0);
        summary.put("liveRates", rates);
        summary.put("currencyBreakdown", currencyBreakdown);
        summary.put("aiInsight", aiInsight);
        return summary;
    }
}