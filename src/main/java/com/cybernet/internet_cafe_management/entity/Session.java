package com.cybernet.internet_cafe_management.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 1. Quan hệ với Computer (computer_id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id", nullable = false)
    private Computer computer;

    // 2. Quan hệ với Account (account_id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    // Thời gian kết thúc - khi phiên kết thúc thì cập nhật thời gian này
    // Mặc định = null vì ban đầu chưa kết thúc
    @Column(nullable = true)
    private LocalDateTime endedAt;

    // Thời gian hết hạn - sau thời gian này thì session sẽ tự động kết thúc
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // 3. Enum trạng thái phiên
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    public enum Status {
        ACTIVE, ENDED
    }
}
