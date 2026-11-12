package com.cybernet.internet_cafe_management.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table(name="order_items")
@Data 
@NoArgsConstructor 

public class OrderItem {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    private String itemNameSnapshot;
    @Enumerated(EnumType.STRING)
    private Item.Type itemTypeSnapshot;
    private Integer packageMinutesSnapshot;

    @PrePersist
    public void captureSnapshot() {
        if (itemNameSnapshot == null) itemNameSnapshot = item.getName();
        if (itemTypeSnapshot == null) itemTypeSnapshot = item.getType();
        if (packageMinutesSnapshot == null) packageMinutesSnapshot = PlaytimeMinutes.minutes(
                itemNameSnapshot, itemTypeSnapshot.name(), unitPrice != null ? unitPrice : item.getPrice());
    }
    
    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal subtotal;
}
