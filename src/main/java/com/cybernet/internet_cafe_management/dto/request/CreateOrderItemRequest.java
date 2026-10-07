package com.cybernet.internet_cafe_management.dto.request;

/**
 * Request DTO: Thông tin 1 món trong giỏ hàng khi khách đặt món.
 */
public class CreateOrderItemRequest {

    private Long itemId;
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
