package com.cybernet.internet_cafe_management.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cybernet.internet_cafe_management.dto.request.CreateItemRequest;
import com.cybernet.internet_cafe_management.dto.response.ItemResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.service.ItemService;

@Tag(name = "Item Management", description = "APIs quản lý menu đồ ăn, thức uống và các gói giờ chơi (Playtime)")
@RestController
@RequestMapping("/api/items")
public class ItemController {
    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @Operation(summary = "Tạo món hàng mới", description = "Thêm món ăn, thức uống hoặc gói giờ chơi mới vào menu. Yêu cầu đặc quyền ADMIN.")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody CreateItemRequest request) {
        ItemResponse response = itemService.createItem(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @Operation(summary = "Lấy danh sách tất cả món hàng (phân trang)", description = "Lấy danh sách toàn bộ mặt hàng có phân trang và sắp xếp.")
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<PageResponse<ItemResponse>> getAllItems(
            @PageableDefault(sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<ItemResponse> response = itemService.getAllItem(pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lấy chi tiết món hàng theo ID", description = "Xem thông tin chi tiết, giá tiền và trạng thái còn hàng.")
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        ItemResponse response = itemService.getItemById(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Operation(summary = "Lấy danh sách món hàng theo loại (phân trang)", description = "Lọc menu theo loại: FOOD, DRINK, hoặc PLAYTIME có phân trang.")
    @GetMapping("/type/{type}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<PageResponse<ItemResponse>> getItemByType(
            @PathVariable Item.Type type,
            @PageableDefault(sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<ItemResponse> response = itemService.getItemByType(type, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cập nhật thông tin món hàng", description = "Chỉnh sửa tên, giá tiền, loại mặt hàng hoặc trạng thái tồn kho. Yêu cầu đặc quyền ADMIN.")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id, @RequestBody CreateItemRequest request) {
        ItemResponse response = itemService.updateItem(id, request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Operation(summary = "Xóa món hàng", description = "Xóa một mặt hàng khỏi menu hệ thống. Yêu cầu đặc quyền ADMIN.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService
                .deleteItem(id);
        return ResponseEntity.noContent().build();
    }

}
