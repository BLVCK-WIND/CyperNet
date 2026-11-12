package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.service.*;
import com.cybernet.internet_cafe_management.dto.request.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OwnershipAndBillingSafetyTest {
    final AccountRepository accounts = mock(AccountRepository.class);
    final ComputerRepository computers = mock(ComputerRepository.class);
    final SessionRepository sessions = mock(SessionRepository.class);
    final OrderRepository orders = mock(OrderRepository.class);
    final ItemRepository items = mock(ItemRepository.class);
    final RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
    final RealtimeNotificationService realtime = mock(RealtimeNotificationService.class);
    final AuditLogService audit = mock(AuditLogService.class);
    final SessionService sessionService = new SessionService(sessions, computers, accounts, tokens, mock(PasswordEncoder.class), realtime, audit);
    final OrderService orderService = new OrderService(orders, sessions, sessionService, items, accounts, computers, realtime, audit);
    final Account owner = account(1L, Account.Role.CUSTOMER);
    final Account stranger = account(2L, Account.Role.CUSTOMER);
    final Account staff = account(3L, Account.Role.STAFF);
    final Computer computer = new Computer();
    final Session session = new Session();
    final Order order = new Order();

    OwnershipAndBillingSafetyTest() {
        owner.setPhone("0901111111"); stranger.setPhone("0902222222"); owner.setRemainingMinutes(120);
        computer.setId(1L); computer.setCode("PC-01"); computer.setZone("STANDARD");
        computer.setPricePerHour(BigDecimal.valueOf(10000)); computer.setStatus(Computer.Status.IN_USE);
        session.setId(1L); session.setAccount(owner); session.setComputer(computer);
        session.setStartedAt(LocalDateTime.now().minusMinutes(5)); session.setExpiresAt(LocalDateTime.now().plusMinutes(60));
        session.setPricePerHourSnapshot(BigDecimal.valueOf(10000));
        order.setId(1L); order.setAccount(owner); order.setComputer(computer);
        order.setPaymentMethod(Order.PaymentMethod.CASH); order.setOrderItems(new ArrayList<>());
        when(accounts.findByPhone(stranger.getPhone())).thenReturn(Optional.of(stranger));
        when(accounts.findByPhone(owner.getPhone())).thenReturn(Optional.of(owner));
        when(accounts.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(accounts.findByIdWithLock(owner.getId())).thenReturn(Optional.of(owner));
        when(orders.findByIdWithLock(1L)).thenReturn(Optional.of(order));
        when(orders.save(any())).thenAnswer(c -> c.getArgument(0));
        when(sessions.findAccountId(1L)).thenReturn(Optional.of(owner.getId()));
        when(sessions.findByIdWithLock(1L)).thenReturn(Optional.of(session));
        when(sessions.save(any())).thenAnswer(c -> c.getArgument(0));
    }
    static Account account(Long id, Account.Role role) { Account a = new Account(); a.setId(id); a.setRole(role); return a; }

    @Test void customerCannotCancelSomeoneElsesOrder() {
        assertThrows(AccessDeniedException.class, () -> orderService.cancelOrder(1L, stranger.getPhone()));
        verify(orders, never()).save(any());
    }
    @Test void ownerCanCancelAndConfirmedOrdersCannotBeCancelled() {
        assertEquals(Order.Status.CANCELLED, orderService.cancelOrder(1L, owner.getPhone()).getStatus());
        order.setStatus(Order.Status.CONFIRMED);
        assertThrows(IllegalStateException.class, () -> orderService.cancelOrder(1L, owner.getPhone()));
    }
    @Test void computerCodeCannotBypassOwnership() {
        when(computers.findByCode("PC-01")).thenReturn(Optional.of(computer));
        when(sessions.findByComputerCodeAndStatus("PC-01", Session.Status.ACTIVE)).thenReturn(Optional.of(session));
        CreateOrderItemRequest line = new CreateOrderItemRequest(); line.setItemId(1L); line.setQuantity(1);
        CreateOrderRequest request = new CreateOrderRequest(null, "PC-01", Order.PaymentMethod.CASH, List.of(line));
        assertThrows(AccessDeniedException.class, () -> orderService.createOrder(request, stranger.getPhone()));
        verify(orders, never()).save(any());
    }
    @Test void customersCannotReadOtherActiveSessions() {
        when(sessions.findByComputerCodeAndStatus("PC-01", Session.Status.ACTIVE)).thenReturn(Optional.of(session));
        assertThrows(AccessDeniedException.class, () -> sessionService.getActiveSessionByComputerCode("PC-01", stranger.getPhone()));
        assertEquals(1L, sessionService.getActiveSessionByComputerCode("PC-01", owner.getPhone()).getAccountId());
    }
    @Test void schedulerDoesNotCloseSessionExtendedAfterSelection() {
        sessionService.autoEndExpiredSession(1L);
        assertEquals(Session.Status.ACTIVE, session.getStatus());
        assertEquals(120, owner.getRemainingMinutes());
        verify(sessions, never()).save(any()); verifyNoInteractions(tokens);
    }
    @Test void schedulerClosesActuallyExpiredSession() {
        session.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        sessionService.autoEndExpiredSession(1L);
        assertEquals(Session.Status.ENDED, session.getStatus());
        assertEquals(0, owner.getRemainingMinutes());
        verify(tokens).deleteByAccountId(owner.getId());
    }
    @Test void confirmationUsesPurchasedSnapshotAndCannotReplay() {
        Item item = new Item(); item.setId(1L); item.setName("Changed to food"); item.setType(Item.Type.FOOD);
        OrderItem line = new OrderItem(); line.setItem(item); line.setQuantity(1);
        line.setItemNameSnapshot("1 hour"); line.setItemTypeSnapshot(Item.Type.PLAYTIME); line.setPackageMinutesSnapshot(60);
        order.getOrderItems().add(line);
        orderService.confirmOrder(1L, staff.getId());
        assertEquals(180, owner.getRemainingMinutes());
        assertThrows(IllegalStateException.class, () -> orderService.confirmOrder(1L, staff.getId()));
        assertEquals(180, owner.getRemainingMinutes());
    }
    @Test void qrRequiresCustomerTransferNotification() {
        order.setPaymentMethod(Order.PaymentMethod.QR);
        assertThrows(IllegalStateException.class, () -> orderService.confirmOrder(1L, staff.getId()));
        assertThrows(AccessDeniedException.class, () -> orderService.notifyTransferred(1L, stranger.getPhone()));
        orderService.notifyTransferred(1L, owner.getPhone());
        assertEquals(Order.Status.WAITING_CONFIRMATION, order.getStatus());
        orderService.confirmOrder(1L, staff.getId());
        assertEquals(Order.Status.CONFIRMED, order.getStatus());
    }
    @Test void priceEditsDoNotInflateRefund() {
        computer.setPricePerHour(BigDecimal.valueOf(30000));
        sessionService.endSession(1L);
        assertTrue(owner.getRemainingMinutes() >= 58 && owner.getRemainingMinutes() <= 60);
    }
    @Test void transferConvertsFromThePurchasedTariff() {
        computer.setPricePerHour(BigDecimal.valueOf(30000));
        Computer target = new Computer(); target.setId(2L); target.setCode("VIP-01"); target.setStatus(Computer.Status.AVAILABLE);
        target.setPricePerHour(BigDecimal.valueOf(15000)); target.setZone("VIP");
        when(computers.findByIdWithLock(2L)).thenReturn(Optional.of(target));
        TransferComputerRequest request = new TransferComputerRequest(); request.setToComputerId(2L);
        sessionService.transferComputer(1L, request);
        assertEquals(BigDecimal.valueOf(15000), session.getPricePerHourSnapshot());
        long minutes = java.time.Duration.between(LocalDateTime.now(), session.getExpiresAt()).toMinutes();
        assertTrue(minutes >= 38 && minutes <= 40);
    }
    @Test void legacyPackageParserFreezesDiscountedMinutes() {
        assertEquals(120, db.migration.V11_1__BackfillPackageMinutes.minutes("2 hour package", "PLAYTIME", BigDecimal.valueOf(18000)));
        assertEquals(30, db.migration.V11_1__BackfillPackageMinutes.minutes("30 min", "PLAYTIME", BigDecimal.valueOf(10000)));
        assertEquals(0, db.migration.V11_1__BackfillPackageMinutes.minutes("2 hour", "FOOD", BigDecimal.TEN));
    }
}
