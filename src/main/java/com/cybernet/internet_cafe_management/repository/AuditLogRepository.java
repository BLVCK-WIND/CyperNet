package com.cybernet.internet_cafe_management.repository;

import com.cybernet.internet_cafe_management.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    Page<AuditLog> findByActorPhoneOrderByCreatedAtDesc(String actorPhone, Pageable pageable);

    Page<AuditLog> findByActionAndActorPhoneOrderByCreatedAtDesc(String action, String actorPhone, Pageable pageable);
}
