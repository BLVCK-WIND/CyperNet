package com.cybernet.internet_cafe_management.repository.specification;

import com.cybernet.internet_cafe_management.entity.Order;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
            String customerPhone,
            String keyword) {

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

            String term = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
            boolean exactId = term.startsWith("#") || term.startsWith("ord-");
            if (exactId) {
                String digits = term.startsWith("#") ? term.substring(1) : term.substring(4);
                try {
                    long id = Long.parseLong(digits);
                    if (!digits.matches("[0-9]+") || id <= 0) return cb.disjunction();
                    predicates.add(cb.equal(root.get("id"), id));
                } catch (NumberFormatException invalidId) {
                    return cb.disjunction();
                }
            }

            boolean filterComputer = computerCode != null && !computerCode.isBlank();
            boolean filterCustomer = customerPhone != null && !customerPhone.isBlank();
            if (filterComputer || filterCustomer || (!term.isEmpty() && !exactId)) {
                var session = root.join("session", JoinType.LEFT);
                var computer = root.join("computer", JoinType.LEFT);
                var sessionComputer = session.join("computer", JoinType.LEFT);
                var account = root.join("account", JoinType.LEFT);
                var sessionAccount = session.join("account", JoinType.LEFT);
                // Match the same direct-link-first identity returned by OrderResponse.
                Expression<String> code = cb.coalesce(computer.<String>get("code"), sessionComputer.<String>get("code"));
                Expression<String> phone = cb.coalesce(account.<String>get("phone"), sessionAccount.<String>get("phone"));
                Expression<String> name = cb.coalesce(account.<String>get("name"), sessionAccount.<String>get("name"));
                if (filterComputer) predicates.add(cb.equal(code, computerCode.trim()));
                if (filterCustomer) predicates.add(cb.equal(phone, customerPhone.trim()));
                if (!term.isEmpty() && !exactId) {
                    String pattern = "%" + term.replace('đ', 'd').replace("!", "!!")
                            .replace("%", "!%").replace("_", "!_") + "%";
                    var normalizedName = cb.function("replace", String.class, cb.lower(name), cb.literal("đ"), cb.literal("d"));
                    predicates.add(cb.or(cb.like(cb.lower(code), pattern, '!'),
                            cb.like(cb.lower(phone), pattern, '!'), cb.like(normalizedName, pattern, '!')));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
