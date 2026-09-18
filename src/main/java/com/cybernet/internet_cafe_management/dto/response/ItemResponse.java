package com.cybernet.internet_cafe_management.dto.response;

import java.math.BigDecimal;

import com.cybernet.internet_cafe_management.entity.Item;

public class ItemResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private boolean available;
    private Item.Type type;

    public ItemResponse() {
    }

    public ItemResponse(Long id, String name, BigDecimal price, boolean available, Item.Type type) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.available = available;
        this.type = type;
    }

    public static ItemResponse fromEntity(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getName(),
                item.getPrice(),
                item.isAvailable(),
                item.getType());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public Item.Type getType() {
        return type;
    }

    public void setType(Item.Type type) {
        this.type = type;
    }

}
