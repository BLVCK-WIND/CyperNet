package com.cybernet.internet_cafe_management.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.cybernet.internet_cafe_management.dto.request.CreateItemRequest;
import com.cybernet.internet_cafe_management.dto.request.UpdateItemRequest;
import com.cybernet.internet_cafe_management.dto.response.ItemResponse;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.ItemRepository;
import com.cybernet.internet_cafe_management.repository.OrderItemRepository;

@Service
public class ItemService {
    private final ItemRepository itemRepository;
    private final OrderItemRepository orderItemRepository;

    public ItemService(ItemRepository itemRepository, OrderItemRepository orderItemRepository) {
        this.itemRepository = itemRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public ItemResponse createItem(CreateItemRequest request) {
        String cleanName = request.getName() != null ? request.getName().trim() : "";
        if (itemRepository.existsByNameIgnoreCase(cleanName)) {
            throw new IllegalArgumentException("Món hàng [" + cleanName + "] đã tồn tại!");
        }
        Item item = new Item();
        item.setName(cleanName);
        item.setPrice(request.getPrice());
        item.setAvailable(request.isAvailable());
        item.setType(request.getType());
        item.setImageUrl(request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty() ? request.getImageUrl().trim() : null);
        return ItemResponse.fromEntity(itemRepository.save(item));
    }

    public List<ItemResponse> getAllItem() {
        return itemRepository.findAll().stream().map(ItemResponse::fromEntity).toList();
    }

    public PageResponse<ItemResponse> getAllItem(Pageable pageable) {
        Page<Item> page = itemRepository.findAll(pageable);
        return PageResponse.fromPage(page, ItemResponse::fromEntity);
    }

    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));
        return ItemResponse.fromEntity(item);
    }

    public List<ItemResponse> getItemByType(Item.Type type) {
        return itemRepository.findByType(type).stream().map(ItemResponse::fromEntity).toList();
    }

    public PageResponse<ItemResponse> getItemByType(Item.Type type, Pageable pageable) {
        Page<Item> page = itemRepository.findByType(type, pageable);
        return PageResponse.fromPage(page, ItemResponse::fromEntity);
    }

    public ItemResponse updateItem(Long id, CreateItemRequest request) {
        return updateItem(id, new UpdateItemRequest(
                request.getName(),
                request.getPrice(),
                request.isAvailable(),
                request.getType(),
                request.getImageUrl()
        ));
    }

    public ItemResponse updateItem(Long id, UpdateItemRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));

        String cleanName = request.getName() != null ? request.getName().trim() : "";
        if (!cleanName.isBlank() && !cleanName.equalsIgnoreCase(item.getName())) {
            if (itemRepository.existsByNameIgnoreCaseAndIdNot(cleanName, item.getId())) {
                throw new IllegalArgumentException("Tên món ăn [" + cleanName + "] đã tồn tại trong thực đơn!");
            }
            item.setName(cleanName);
        }

        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
        }
        item.setAvailable(request.isAvailable());
        if (request.getType() != null) {
            item.setType(request.getType());
        }
        if (request.getImageUrl() != null) {
            item.setImageUrl(request.getImageUrl().trim().isEmpty() ? null : request.getImageUrl().trim());
        }
        return ItemResponse.fromEntity(itemRepository.save(item));
    }

    public void deleteItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));

        if (orderItemRepository.existsByItemId(item.getId())) {
            throw new IllegalStateException("Không thể xóa món ăn đã có trong lịch sử đơn hàng. Vui lòng chuyển trạng thái sang HẾT HÀNG (ngừng kinh doanh)!");
        }

        itemRepository.delete(item);
    }
}
