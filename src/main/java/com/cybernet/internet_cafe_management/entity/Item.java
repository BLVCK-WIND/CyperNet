package com.cybernet.internet_cafe_management.entity;

import java.math.BigDecimal;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "items")
@Data
@NoArgsConstructor
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
    @Column(nullable = false)
    private BigDecimal price;

    // True = còn hàng, False = hết hàng
    @Column(nullable = false)
    private boolean available = true;

    public enum Type {
        DRINK, FOOD, SERVICE, PLAYTIME
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

}
