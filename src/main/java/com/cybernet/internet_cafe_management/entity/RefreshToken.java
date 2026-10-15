package com.cybernet.internet_cafe_management.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refresh_tokens")
@Data
@NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Token string (UUID duy nhất — nhẹ hơn JWT và dễ revoke)
    @Column(nullable = false, unique = true)
    private String token;

    // Chủ sở hữu token
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    // Thời điểm hết hạn
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // Thời điểm tạo
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
