package com.cybernet.internet_cafe_management.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cybernet.internet_cafe_management.dto.request.CreateItemRequest;
import com.cybernet.internet_cafe_management.dto.response.ItemResponse;
import com.cybernet.internet_cafe_management.entity.Item;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.ItemRepository;

@Service
public class ItemService {
    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public ItemResponse createItem(CreateItemRequest request) {
        if (itemRepository.existsByName(request.getName()))
            throw new IllegalArgumentException("Món hàng " + request.getName() + " đã tồn tại");
        Item item = new Item();
        item.setName(request.getName());
        item.setPrice(request.getPrice());
        item.setAvailable(request.isAvailable());
        item.setType(request.getType());
        return ItemResponse.fromEntity(itemRepository.save(item));
    }

    public List<ItemResponse> getAllItem() {
        return itemRepository.findAll().stream().map(ItemResponse::fromEntity).toList();
    }

    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));
        return ItemResponse.fromEntity(item);
    }

    public List<ItemResponse> getItemByType(Item.Type type) {
        return itemRepository.findByType(type).stream().map(ItemResponse::fromEntity).toList();
    }

    public ItemResponse updateItem(Long id, CreateItemRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));
        item.setName(request.getName());
        item.setPrice(request.getPrice());
        item.setAvailable(request.isAvailable());
        item.setType(request.getType());
        return ItemResponse.fromEntity(itemRepository.save(item));
    }

    public void deleteItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với id: " + id));
        itemRepository.delete(item);
    }
}
