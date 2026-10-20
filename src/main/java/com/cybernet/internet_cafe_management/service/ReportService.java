package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.response.report.*;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final OrderRepository orderRepository;
    private final TimePurchaseRepository timePurchaseRepository;
    private final OrderItemRepository orderItemRepository;
    private final SessionRepository sessionRepository;
    private final AccountRepository accountRepository;

    public ReportService(OrderRepository orderRepository,
                         TimePurchaseRepository timePurchaseRepository,
                         OrderItemRepository orderItemRepository,
                         SessionRepository sessionRepository,
                         AccountRepository accountRepository) {
        this.orderRepository = orderRepository;
        this.timePurchaseRepository = timePurchaseRepository;
        this.orderItemRepository = orderItemRepository;
        this.sessionRepository = sessionRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * 1. BÁO CÁO TỔNG QUAN DOANH THU (Revenue Summary)
     * Thống kê tổng thu, thu nạp quầy, thu gọi món, cơ cấu tiền mặt/QR và cơ cấu F&B/Playtime.
     */
    public RevenueSummaryResponse getRevenueSummary(LocalDate fromDate, LocalDate toDate) {
        LocalDate[] resolvedDates = resolveDateRange(fromDate, toDate);
        LocalDate start = resolvedDates[0];
        LocalDate end = resolvedDates[1];

        LocalDateTime fromTime = start.atStartOfDay();
        LocalDateTime toTime = end.atTime(LocalTime.MAX);

        // 1. Doanh thu từ Order (đã thanh toán CONFIRMED)
        BigDecimal totalOrderRevenue = orderRepository.sumRevenueByStatusAndDateRange(Order.Status.CONFIRMED, fromTime, toTime);
        long totalOrders = orderRepository.countByStatusAndDateRange(Order.Status.CONFIRMED, fromTime, toTime);

        // 2. Doanh thu từ TimePurchase (đã thanh toán CONFIRMED)
        BigDecimal totalTimePurchaseRevenue = timePurchaseRepository.sumRevenueByStatusAndDateRange(TimePurchase.Status.CONFIRMED, fromTime, toTime);
        long totalTimePurchases = timePurchaseRepository.countByStatusAndDateRange(TimePurchase.Status.CONFIRMED, fromTime, toTime);

        // 3. Tổng doanh thu toàn quán
        BigDecimal totalRevenue = totalOrderRevenue.add(totalTimePurchaseRevenue);

        // 4. Doanh thu phân rã theo phương thức thanh toán (CASH vs QR)
        BigDecimal cashRevenue = BigDecimal.ZERO;
        BigDecimal qrRevenue = BigDecimal.ZERO;

        for (Object[] row : orderRepository.sumRevenueByPaymentMethod(Order.Status.CONFIRMED, fromTime, toTime)) {
            Order.PaymentMethod method = (Order.PaymentMethod) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            if (method == Order.PaymentMethod.CASH) {
                cashRevenue = cashRevenue.add(amount);
            } else if (method == Order.PaymentMethod.QR) {
                qrRevenue = qrRevenue.add(amount);
            }
        }

        for (Object[] row : timePurchaseRepository.sumRevenueByPaymentMethod(TimePurchase.Status.CONFIRMED, fromTime, toTime)) {
            TimePurchase.PaymentMethod method = (TimePurchase.PaymentMethod) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            if (method == TimePurchase.PaymentMethod.CASH) {
                cashRevenue = cashRevenue.add(amount);
            } else if (method == TimePurchase.PaymentMethod.QR) {
                qrRevenue = qrRevenue.add(amount);
            }
        }

        // 5. Cơ cấu doanh thu theo loại hàng (F&B vs Playtime)
        BigDecimal totalFoodAndDrinkRevenue = BigDecimal.ZERO;
        BigDecimal playtimeInOrderRevenue = BigDecimal.ZERO;

        for (Object[] row : orderItemRepository.sumRevenueByItemType(Order.Status.CONFIRMED, fromTime, toTime)) {
            Item.Type type = (Item.Type) row[0];
            BigDecimal subtotal = (BigDecimal) row[1];
            if (type == Item.Type.FOOD || type == Item.Type.DRINK) {
                totalFoodAndDrinkRevenue = totalFoodAndDrinkRevenue.add(subtotal);
            } else if (type == Item.Type.PLAYTIME) {
                playtimeInOrderRevenue = playtimeInOrderRevenue.add(subtotal);
            }
        }

        // Tổng doanh thu giờ chơi = nạp tại quầy + gói giờ trong đơn order
        BigDecimal totalPlaytimeRevenue = totalTimePurchaseRevenue.add(playtimeInOrderRevenue);

        return RevenueSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrderRevenue(totalOrderRevenue)
                .totalTimePurchaseRevenue(totalTimePurchaseRevenue)
                .totalFoodAndDrinkRevenue(totalFoodAndDrinkRevenue)
                .totalPlaytimeRevenue(totalPlaytimeRevenue)
                .cashRevenue(cashRevenue)
                .qrRevenue(qrRevenue)
                .totalOrders(totalOrders)
                .totalTimePurchases(totalTimePurchases)
                .fromDate(start)
                .toDate(end)
                .build();
    }

    /**
     * 2. BÁO CÁO DOANH THU THEO TỪNG NGÀY (Daily Revenue Trend)
     * Trả về danh sách doanh thu liên tục từ start đến end để vẽ biểu đồ tài chính.
     */
    public List<DailyRevenueResponse> getDailyRevenue(LocalDate fromDate, LocalDate toDate) {
        LocalDate[] resolvedDates = resolveDateRange(fromDate, toDate);
        LocalDate start = resolvedDates[0];
        LocalDate end = resolvedDates[1];

        LocalDateTime fromTime = start.atStartOfDay();
        LocalDateTime toTime = end.atTime(LocalTime.MAX);

        // Map tạm gom Order theo ngày
        Map<LocalDate, BigDecimal> orderRevMap = new HashMap<>();
        Map<LocalDate, Long> orderCountMap = new HashMap<>();

        for (Object[] row : orderRepository.findDailyOrderRevenue(Order.Status.CONFIRMED, fromTime, toTime)) {
            LocalDate date = parseDate(row[0]);
            if (date != null) {
                orderRevMap.put(date, (BigDecimal) row[1]);
                orderCountMap.put(date, ((Number) row[2]).longValue());
            }
        }

        // Map tạm gom TimePurchase theo ngày
        Map<LocalDate, BigDecimal> tpRevMap = new HashMap<>();
        Map<LocalDate, Long> tpCountMap = new HashMap<>();

        for (Object[] row : timePurchaseRepository.findDailyTimePurchaseRevenue(TimePurchase.Status.CONFIRMED, fromTime, toTime)) {
            LocalDate date = parseDate(row[0]);
            if (date != null) {
                tpRevMap.put(date, (BigDecimal) row[1]);
                tpCountMap.put(date, ((Number) row[2]).longValue());
            }
        }

        // Sinh danh sách liên tục các ngày từ start đến end
        List<DailyRevenueResponse> result = new ArrayList<>();
        LocalDate current = start;
        while (!current.isAfter(end)) {
            BigDecimal orderRev = orderRevMap.getOrDefault(current, BigDecimal.ZERO);
            BigDecimal tpRev = tpRevMap.getOrDefault(current, BigDecimal.ZERO);
            long orderCnt = orderCountMap.getOrDefault(current, 0L);
            long tpCnt = tpCountMap.getOrDefault(current, 0L);

            result.add(DailyRevenueResponse.builder()
                    .date(current)
                    .orderRevenue(orderRev)
                    .timePurchaseRevenue(tpRev)
                    .totalRevenue(orderRev.add(tpRev))
                    .orderCount(orderCnt)
                    .timePurchaseCount(tpCnt)
                    .build());

            current = current.plusDays(1);
        }

        return result;
    }

    /**
     * 3. THỐNG KÊ MÓN BÁN CHẠY NHẤT (Top-selling Items)
     */
    public List<TopItemResponse> getTopSellingItems(LocalDate fromDate, LocalDate toDate, int limit) {
        LocalDate[] resolvedDates = resolveDateRange(fromDate, toDate);
        LocalDateTime fromTime = resolvedDates[0].atStartOfDay();
        LocalDateTime toTime = resolvedDates[1].atTime(LocalTime.MAX);

        int resolvedLimit = Math.max(1, Math.min(limit, 100)); // An toàn từ 1 đến 100 món
        List<Object[]> rawList = orderItemRepository.findTopSellingItems(
                Order.Status.CONFIRMED, fromTime, toTime, PageRequest.of(0, resolvedLimit));

        List<TopItemResponse> result = new ArrayList<>();
        for (Object[] row : rawList) {
            result.add(TopItemResponse.builder()
                    .itemId(((Number) row[0]).longValue())
                    .itemName((String) row[1])
                    .itemType((Item.Type) row[2])
                    .totalQuantity(((Number) row[3]).longValue())
                    .totalRevenue((BigDecimal) row[4])
                    .build());
        }
        return result;
    }

    /**
     * 4. THỐNG KÊ TOP KHÁCH HÀNG CHI TIÊU NHIỀU NHẤT (Top Spenders)
     */
    public List<TopCustomerResponse> getTopSpendingCustomers(LocalDate fromDate, LocalDate toDate, int limit) {
        LocalDate[] resolvedDates = resolveDateRange(fromDate, toDate);
        LocalDateTime fromTime = resolvedDates[0].atStartOfDay();
        LocalDateTime toTime = resolvedDates[1].atTime(LocalTime.MAX);

        int resolvedLimit = Math.max(1, Math.min(limit, 50));

        // Map lưu accountId -> [Name, Phone, TotalSpent]
        class SpendingInfo {
            String name;
            String phone;
            BigDecimal spent = BigDecimal.ZERO;
            SpendingInfo(String name, String phone) {
                this.name = name;
                this.phone = phone;
            }
        }
        Map<Long, SpendingInfo> map = new HashMap<>();

        // 1. Cộng tiền từ đơn Order
        for (Object[] row : orderRepository.findSpendingByAccount(Order.Status.CONFIRMED, fromTime, toTime)) {
            Long accId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String phone = (String) row[2];
            BigDecimal spent = (BigDecimal) row[3];

            SpendingInfo info = map.computeIfAbsent(accId, k -> new SpendingInfo(name, phone));
            info.spent = info.spent.add(spent);
        }

        // 2. Cộng tiền từ TimePurchase
        for (Object[] row : timePurchaseRepository.findSpendingByAccount(TimePurchase.Status.CONFIRMED, fromTime, toTime)) {
            Long accId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String phone = (String) row[2];
            BigDecimal spent = (BigDecimal) row[3];

            SpendingInfo info = map.computeIfAbsent(accId, k -> new SpendingInfo(name, phone));
            info.spent = info.spent.add(spent);
        }

        // 3. Tính tổng phút chơi thực tế của các tài khoản
        Map<Long, Long> gamingMinutesMap = new HashMap<>();
        for (Object[] row : sessionRepository.findCustomerSessionDurations(fromTime, toTime)) {
            Long accId = ((Number) row[0]).longValue();
            LocalDateTime start = (LocalDateTime) row[3];
            LocalDateTime end = (LocalDateTime) row[4];
            long minutes = Duration.between(start, end != null ? end : LocalDateTime.now()).toMinutes();
            gamingMinutesMap.put(accId, gamingMinutesMap.getOrDefault(accId, 0L) + Math.max(0, minutes));
        }

        // 4. Sắp xếp giảm dần theo tổng chi tiêu và lấy top N
        return map.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().spent.compareTo(e1.getValue().spent))
                .limit(resolvedLimit)
                .map(entry -> {
                    Long accId = entry.getKey();
                    SpendingInfo info = entry.getValue();
                    int remainingMins = accountRepository.findById(accId)
                            .map(Account::getRemainingMinutes)
                            .orElse(0);

                    return TopCustomerResponse.builder()
                            .accountId(accId)
                            .name(info.name)
                            .phone(info.phone)
                            .totalSpent(info.spent)
                            .remainingMinutes(remainingMins)
                            .totalMinutesPlayed(gamingMinutesMap.getOrDefault(accId, 0L))
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 5. THỐNG KÊ CÔNG SUẤT VÀ HIỆU SUẤT MÁY TRẠM (Computer Usage)
     */
    public List<ComputerUsageResponse> getComputerUsageStats(LocalDate fromDate, LocalDate toDate) {
        LocalDate[] resolvedDates = resolveDateRange(fromDate, toDate);
        LocalDateTime fromTime = resolvedDates[0].atStartOfDay();
        LocalDateTime toTime = resolvedDates[1].atTime(LocalTime.MAX);

        // 1. Lấy tổng số phút sử dụng theo máy
        Map<Long, Long> minutesMap = new HashMap<>();
        for (Object[] row : sessionRepository.findComputerSessionDurations(fromTime, toTime)) {
            Long compId = ((Number) row[0]).longValue();
            LocalDateTime start = (LocalDateTime) row[1];
            LocalDateTime end = (LocalDateTime) row[2];
            long minutes = Duration.between(start, end != null ? end : LocalDateTime.now()).toMinutes();
            minutesMap.put(compId, minutesMap.getOrDefault(compId, 0L) + Math.max(0, minutes));
        }

        // 2. Lấy số lượt phiên mở và ghép nối
        List<ComputerUsageResponse> result = new ArrayList<>();
        for (Object[] row : sessionRepository.findComputerUsageCount(fromTime, toTime)) {
            Long compId = ((Number) row[0]).longValue();
            String code = (String) row[1];
            Computer.Zone zone = (Computer.Zone) row[2];
            long sessionCount = ((Number) row[3]).longValue();
            long totalMinutes = minutesMap.getOrDefault(compId, 0L);

            result.add(ComputerUsageResponse.builder()
                    .computerId(compId)
                    .computerCode(code)
                    .zone(zone)
                    .totalSessions(sessionCount)
                    .totalMinutesUsed(totalMinutes)
                    .build());
        }

        return result;
    }

    // === HELPER METHODS ===

    /**
     * Giải quyết khoảng thời gian an toàn:
     * - Mặc định 30 ngày gần nhất nếu để trống.
     * - Tự động đảo lại nếu fromDate > toDate.
     */
    private LocalDate[] resolveDateRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate end = (toDate != null) ? toDate : LocalDate.now();
        LocalDate start = (fromDate != null) ? fromDate : end.minusDays(30);

        if (start.isAfter(end)) {
            LocalDate temp = start;
            start = end;
            end = temp;
        }
        return new LocalDate[]{start, end};
    }

    /**
     * Parse date an toàn từ kết quả hàm SQL (hỗ trợ java.sql.Date, LocalDate, String)
     */
    private LocalDate parseDate(Object dateObj) {
        if (dateObj == null) {
            return null;
        }
        if (dateObj instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        if (dateObj instanceof LocalDate localDate) {
            return localDate;
        }
        try {
            return LocalDate.parse(dateObj.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
