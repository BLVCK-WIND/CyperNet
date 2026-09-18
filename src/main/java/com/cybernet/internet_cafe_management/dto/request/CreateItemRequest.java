package com.cybernet.internet_cafe_management.dto.request;

import java.math.BigDecimal;

import com.cybernet.internet_cafe_management.entity.Item;

public class CreateItemRequest {
    private String name;
    private BigDecimal price;
    private boolean available;
    private Item.Type type;

    public CreateItemRequest() {
    }

    public CreateItemRequest(String name, BigDecimal price, boolean available, Item.Type type) {
        this.name = name;
        this.price = price;
        this.available = available;
        this.type = type;
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
