package com.cybernet.internet_cafe_management.dto.response.report;

import com.cybernet.internet_cafe_management.entity.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopItemResponse {

    // ID món hàng
    private Long itemId;

    // Tên món
    private String itemName;

    // Phân loại (DRINK, FOOD, SERVICE, PLAYTIME)
    private Item.Type itemType;

    // Tổng số lượng đã bán ra
    private long totalQuantity;

    // Tổng doanh thu đem lại từ món này
    private BigDecimal totalRevenue;
}
