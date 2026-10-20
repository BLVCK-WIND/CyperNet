package com.cybernet.internet_cafe_management.dto.request;

import java.math.BigDecimal;

import com.cybernet.internet_cafe_management.entity.Item;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class CreateItemRequest {

    @NotBlank(message = "Tên món không được để trống")
    @Size(max = 100, message = "Tên món tối đa 100 ký tự")
    private String name;

    @NotNull(message = "Giá món không được để trống")
    @PositiveOrZero(message = "Giá món không được âm")
    private BigDecimal price;

    private boolean available = true;

    @NotNull(message = "Loại mặt hàng không được để trống")
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
