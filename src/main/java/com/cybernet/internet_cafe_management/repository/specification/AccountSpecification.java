package com.cybernet.internet_cafe_management.repository.specification;

import com.cybernet.internet_cafe_management.entity.Account;
import org.springframework.data.jpa.domain.Specification;
import java.util.Locale;

public final class AccountSpecification {
    private AccountSpecification() {}

    public static Specification<Account> filter(Account.Role role, String keyword) {
        String term = keyword == null ? "" : keyword.trim();
        return (root, query, cb) -> {
            var visible = role == null ? cb.conjunction() : cb.equal(root.get("role"), role);
            if (term.isEmpty()) return visible;
            if (term.startsWith("#")) {
                try {
                    long id = Long.parseLong(term.substring(1));
                    return id > 0 ? cb.and(visible, cb.equal(root.get("id"), id)) : cb.disjunction();
                } catch (NumberFormatException invalidId) {
                    return cb.disjunction();
                }
            }
            // utf8mb4_unicode_ci handles vowel accents; normalize the separate Vietnamese letter đ explicitly.
            // Escape SQL LIKE wildcards so user input is always a literal substring.
            String pattern = "%" + term.toLowerCase(Locale.ROOT).replace('đ', 'd')
                    .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
            return cb.and(visible, cb.or(cb.like(cb.lower(root.get("phone")), pattern, '!'),
                    cb.like(cb.function("replace", String.class, cb.lower(root.get("name")),
                            cb.literal("đ"), cb.literal("d")), pattern, '!')));
        };
    }
}
