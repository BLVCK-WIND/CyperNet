package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Item.Type;
import com.cybernet.internet_cafe_management.entity.OrderItem;

import java.math.BigDecimal;

/**
 * Response DTO: Chi tiết từng món trong đơn hàng trả về cho Client.
 */
public class OrderItemResponse {

    private Long id;
    private Long itemId;
    private String itemName;
    private Type itemType;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String itemImageUrl;

    public OrderItemResponse() {
    }

    public OrderItemResponse(Long id, Long itemId, String itemName, Type itemType,
                             int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
        this(id, itemId, itemName, itemType, quantity, unitPrice, subtotal, null);
    }

    public OrderItemResponse(Long id, Long itemId, String itemName, Type itemType,
                             int quantity, BigDecimal unitPrice, BigDecimal subtotal, String itemImageUrl) {
        this.id = id;
        this.itemId = itemId;
        this.itemName = itemName;
        this.itemType = itemType;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.itemImageUrl = itemImageUrl;
    }

    public static OrderItemResponse fromEntity(OrderItem orderItem) {
        String imageUrl = (orderItem.getItem() != null) ? orderItem.getItem().getImageUrl() : null;
        return new OrderItemResponse(
                orderItem.getId(),
                orderItem.getItem().getId(),
                orderItem.getItem().getName(),
                orderItem.getItem().getType(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getSubtotal(),
                imageUrl
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Type getItemType() {
        return itemType;
    }

    public void setItemType(Type itemType) {
        this.itemType = itemType;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getItemImageUrl() {
        return itemImageUrl;
    }

    public void setItemImageUrl(String itemImageUrl) {
        this.itemImageUrl = itemImageUrl;
    }

    public String getImageUrl() {
        return itemImageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.itemImageUrl = imageUrl;
    }
}
