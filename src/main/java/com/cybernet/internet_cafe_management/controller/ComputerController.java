package com.cybernet.internet_cafe_management.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cybernet.internet_cafe_management.dto.request.CreateComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.ComputerResponse;
import com.cybernet.internet_cafe_management.service.ComputerService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/computers")
public class ComputerController {
    private final ComputerService computerService;

    public ComputerController(ComputerService computerService) {
        this.computerService = computerService;
    }

    // Tạo mới máy tính
    @PostMapping
    public ResponseEntity<ComputerResponse> createComputer(@RequestBody CreateComputerRequest request) {
        ComputerResponse response = computerService.createComputer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // get all computers
    @GetMapping
    public ResponseEntity<List<ComputerResponse>> getAllComputers() {
        List<ComputerResponse> response = computerService.getAllComputers();
        return ResponseEntity.ok(response);
    }

    // get computer by id
    @GetMapping("/{id}")
    public ResponseEntity<ComputerResponse> getComputerById(@PathVariable Long id) {
        ComputerResponse response = computerService.getComputerById(id);
        return ResponseEntity.ok(response);
    }

    // delete computer
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComputerById(@PathVariable Long id) {
        computerService.deleteComputer(id);
        return ResponseEntity.noContent().build();
    }

    // update
    @PutMapping("/{id}")
    public ResponseEntity<ComputerResponse> updateComputer(@PathVariable Long id,
            @RequestBody CreateComputerRequest request) {
        ComputerResponse response = computerService.updateComputer(id, request);
        return ResponseEntity.ok(response);
    }

}
