package com.cybernet.internet_cafe_management.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO: Thông tin 1 món trong giỏ hàng khi khách đặt món.
 */
public class CreateOrderItemRequest {

    @NotNull(message = "Mã món không được để trống")
    private Long itemId;

    @Min(value = 1, message = "Số lượng món phải từ 1 trở lên")
    private int quantity;

    public CreateOrderItemRequest() {
    }

    public CreateOrderItemRequest(Long itemId, int quantity) {
        this.itemId = itemId;
        this.quantity = quantity;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
