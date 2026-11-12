package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.entity.Account;
import org.springframework.security.access.AccessDeniedException;

public final class CustomerOwnership {
    private CustomerOwnership() {}
    public static void requireOwner(Account caller, Account owner) {
        if (caller == null || (caller.getRole() == Account.Role.CUSTOMER &&
                (owner == null || !caller.getId().equals(owner.getId())))) {
            throw new AccessDeniedException("You can only access your own orders and gaming session.");
        }
    }
}
