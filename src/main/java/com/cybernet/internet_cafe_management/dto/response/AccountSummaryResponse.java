package com.cybernet.internet_cafe_management.dto.response;

import com.cybernet.internet_cafe_management.entity.Account;
import java.util.Map;

/** Totals in the caller's visible scope, independent of table search/pagination. */
public record AccountSummaryResponse(long totalAccounts, Map<Account.Role, Long> countsByRole,
                                     long totalRemainingMinutes) {}
