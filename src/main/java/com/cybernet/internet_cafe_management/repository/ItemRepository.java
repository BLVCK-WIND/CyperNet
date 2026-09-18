package com.cybernet.internet_cafe_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cybernet.internet_cafe_management.entity.Item;

@Repository

public interface ItemRepository extends JpaRepository<Item, Long> {
    boolean existsByName(String name);

    List<Item> findByType(Item.Type type);
}
