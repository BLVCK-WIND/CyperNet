package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record OrderSummaryResponse(LocalDate date, String timezone, Map<Order.Status, Long> countsByStatus,
        long pendingCount, BigDecimal pendingAmount, long backlogCount, BigDecimal backlogAmount,
        long todayCreatedCount, long todayConfirmedCount, BigDecimal todayFoodAndDrinkRevenue) {}
