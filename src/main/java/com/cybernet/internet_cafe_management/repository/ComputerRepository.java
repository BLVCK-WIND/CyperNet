package com.cybernet.internet_cafe_management.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cybernet.internet_cafe_management.entity.Computer;

@Repository
public interface ComputerRepository extends JpaRepository<Computer, Long> {
    boolean existsByCode(String code);

    Optional<Computer> findByCode(String code);
}
