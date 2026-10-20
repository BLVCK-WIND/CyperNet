package com.cybernet.internet_cafe_management.repository.specification;

import com.cybernet.internet_cafe_management.entity.Computer;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specification cho tìm kiếm & lọc máy trạm (Computer).
 */
public class ComputerSpecification {

    public static Specification<Computer> filter(
            Computer.Status status,
            Computer.Zone zone,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (zone != null) {
                predicates.add(cb.equal(root.get("zone"), zone));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerHour"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerHour"), maxPrice));
            }

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate codeLike = cb.like(cb.lower(root.get("code")), pattern);
                Predicate ipLike = cb.like(cb.lower(root.get("ipAddress")), pattern);
                predicates.add(cb.or(codeLike, ipLike));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
