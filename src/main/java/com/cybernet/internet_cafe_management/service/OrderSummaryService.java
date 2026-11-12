package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.response.OrderSummaryResponse;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.repository.OrderItemRepository;
import com.cybernet.internet_cafe_management.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;

import static com.cybernet.internet_cafe_management.config.CafeTimeZoneInitializer.CAFE_ZONE;

@Service
public class OrderSummaryService {
    private final OrderRepository orders;
    private final OrderItemRepository items;

    public OrderSummaryService(OrderRepository orders, OrderItemRepository items) {
        this.orders = orders;
        this.items = items;
    }

    @Transactional(readOnly = true)
    public OrderSummaryResponse getSummary() {
        LocalDate today = LocalDate.now(CAFE_ZONE);
        var from = today.atStartOfDay();
        var to = today.plusDays(1).atStartOfDay();
        var counts = new EnumMap<Order.Status, Long>(Order.Status.class);
        for (Order.Status status : Order.Status.values()) counts.put(status, 0L);
        long pending = 0, backlog = 0, createdToday = 0, confirmedToday = 0;
        BigDecimal pendingAmount = BigDecimal.ZERO, backlogAmount = BigDecimal.ZERO;
        for (var row : orders.summarizeQueue(from, to)) {
            counts.put(row.getStatus(), row.getOrderCount());
            createdToday += row.getCreatedToday();
            if (row.getStatus() == Order.Status.CONFIRMED) confirmedToday = row.getConfirmedToday();
            if (row.getStatus() == Order.Status.PENDING_PAYMENT || row.getStatus() == Order.Status.WAITING_CONFIRMATION) {
                pending += row.getOrderCount();
                pendingAmount = pendingAmount.add(row.getTotalAmount());
                backlog += row.getBacklogCount();
                backlogAmount = backlogAmount.add(row.getBacklogAmount());
            }
        }
        BigDecimal revenue = items.sumRevenueInWindow(Order.Status.CONFIRMED,
                List.of(Item.Type.FOOD, Item.Type.DRINK), from, to);
        return new OrderSummaryResponse(today, CAFE_ZONE.getId(), counts, pending, pendingAmount, backlog,
                backlogAmount, createdToday, confirmedToday, revenue);
    }
}
