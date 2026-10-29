package com.cybernet.internet_cafe_management.repository.specification;

import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Order;
import com.cybernet.internet_cafe_management.entity.Session;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification cho tìm kiếm & lọc đơn hàng nâng cao (Search & Advanced Filtering).
 */
public class OrderSpecification {

    public static Specification<Order> filter(
            Order.Status status,
            Order.PaymentMethod paymentMethod,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String computerCode,
            String customerPhone) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                if (status == Order.Status.PENDING_PAYMENT) {
                    predicates.add(root.get("status").in(List.of(Order.Status.PENDING_PAYMENT, Order.Status.WAITING_CONFIRMATION)));
                } else {
                    predicates.add(cb.equal(root.get("status"), status));
                }
            }

            if (paymentMethod != null) {
                predicates.add(cb.equal(root.get("paymentMethod"), paymentMethod));
            }

            if (fromDate != null && toDate != null) {
                predicates.add(cb.between(root.get("createdAt"), fromDate, toDate));
            } else if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            } else if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalAmount"), minAmount));
            }

            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalAmount"), maxAmount));
            }

            if (computerCode != null && !computerCode.isBlank()) {
                Join<Order, Session> sessionJoin = root.join("session", JoinType.INNER);
                Join<Session, Computer> computerJoin = sessionJoin.join("computer", JoinType.INNER);
                predicates.add(cb.equal(computerJoin.get("code"), computerCode.trim()));
            }

            if (customerPhone != null && !customerPhone.isBlank()) {
                Join<Order, Session> sessionJoin = root.join("session", JoinType.INNER);
                Join<Session, Account> accountJoin = sessionJoin.join("account", JoinType.INNER);
                predicates.add(cb.equal(accountJoin.get("phone"), customerPhone.trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
