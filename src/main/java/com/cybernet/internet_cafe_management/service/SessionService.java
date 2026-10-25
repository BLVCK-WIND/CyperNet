package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.ComputerLoginRequest;
import com.cybernet.internet_cafe_management.dto.request.ExtendSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.StartSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.TransferComputerRequest;
import com.cybernet.internet_cafe_management.dto.response.PageResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionCheckResponse;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.RefreshTokenRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class SessionService {

    public static final BigDecimal BASE_PRICE_PER_HOUR = BigDecimal.valueOf(10000);

    private final SessionRepository sessionRepository;
    private final ComputerRepository computerRepository;
    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final RealtimeNotificationService realtimeNotificationService;
    private final AuditLogService auditLogService;

    // Dependency Injection qua Constructor
    public SessionService(SessionRepository sessionRepository,
                          ComputerRepository computerRepository,
                          AccountRepository accountRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder,
                          RealtimeNotificationService realtimeNotificationService,
                          AuditLogService auditLogService) {
        this.sessionRepository = sessionRepository;
        this.computerRepository = computerRepository;
        this.accountRepository = accountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.realtimeNotificationService = realtimeNotificationService;
        this.auditLogService = auditLogService;
    }

    /**
     * Quy đổi số phút chuẩn Standard sang số phút thực tế chơi được trên máy trạm cụ thể.
     * playableMinutes = floor(standardMinutes * 10000 / pricePerHour)
     */
    public static long calculatePlayableMinutes(int standardMinutes, BigDecimal pricePerHour) {
        if (standardMinutes <= 0) {
            return 0;
        }
        if (pricePerHour == null || pricePerHour.compareTo(BigDecimal.ZERO) <= 0 || pricePerHour.compareTo(BASE_PRICE_PER_HOUR) == 0) {
            return standardMinutes;
        }
        return BigDecimal.valueOf(standardMinutes)
                .multiply(BASE_PRICE_PER_HOUR)
                .divide(pricePerHour, 0, RoundingMode.FLOOR)
                .longValue();
    }

    /**
     * 1. BẮT ĐẦU PHIÊN CHƠI (startSession)
     * Đồng bộ hai chiều giữa Account và Computer. Bắt buộc có @Transactional.
     */
    @Transactional
    public SessionResponse startSession(StartSessionRequest request) {
        // --- BƯỚC 1: VALIDATE KHÁCH HÀNG (ACCOUNT) ---
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng với ID = " + request.getAccountId()));

        // Kiểm tra số dư giờ chơi
        if (account.getRemainingMinutes() <= 0) {
            throw new IllegalArgumentException("Tài khoản đã hết thời gian chơi! Vui lòng nạp thêm giờ trước khi mở máy.");
        }

        // Quy tắc: 1 khách chỉ được mở tối đa 1 phiên ACTIVE cùng thời điểm
        if (sessionRepository.existsByAccountIdAndStatus(account.getId(), Status.ACTIVE)) {
            throw new IllegalStateException("Tài khoản này đang có phiên chơi tại máy khác! Không thể chơi 2 máy cùng lúc.");
        }

        // --- BƯỚC 2: VALIDATE MÁY TÍNH (COMPUTER) ---
        Computer computer = findComputerFromRequest(request);

        // Kiểm tra trạng thái máy: Phải là AVAILABLE
        if (computer.getStatus() != Computer.Status.AVAILABLE) {
            throw new IllegalStateException("Máy tính [" + computer.getCode() + "] hiện không khả dụng! Trạng thái: " + computer.getStatus());
        }

        // Kiểm tra an toàn: Đảm bảo không có phiên ACTIVE nào sót lại trên máy này
        if (sessionRepository.existsByComputerIdAndStatus(computer.getId(), Status.ACTIVE)) {
            throw new IllegalStateException("Máy tính [" + computer.getCode() + "] đang có phiên chơi đang hoạt động!");
        }

        // --- BƯỚC 3: KHỞI TẠO VÀ LƯU PHIÊN CHƠI ---
        LocalDateTime now = LocalDateTime.now();
        Session session = new Session();
        session.setAccount(account);
        session.setComputer(computer);
        session.setStartedAt(now);

        // Quy đổi số phút chơi thực tế theo Dynamic Tariff dựa trên đơn giá máy
        long playableMinutes = calculatePlayableMinutes(account.getRemainingMinutes(), computer.getPricePerHour());
        session.setExpiresAt(now.plusMinutes(playableMinutes));
        session.setStatus(Status.ACTIVE);

        // Đổi trạng thái máy tính sang IN_USE để khoá máy
        computer.setStatus(Computer.Status.IN_USE);
        computerRepository.save(computer);

        Session savedSession = sessionRepository.save(session);
        realtimeNotificationService.broadcastComputerStatus(computer);
        auditLogService.log("START_SESSION", "Session", savedSession.getId(),
                "Mở máy " + computer.getCode() + " cho khách " + account.getPhone() + " (" + playableMinutes + " phút chơi thực tế)");
        return SessionResponse.fromEntity(savedSession);
    }

    /**
     * 2. KẾT THÚC PHIÊN CHƠI (endSession)
     * Trả máy về AVAILABLE và tính toán hoàn lại số phút dư cho khách.
     */
    @Transactional
    public SessionResponse endSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + sessionId));

        if (session.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("Phiên chơi này đã kết thúc trước đó rồi!");
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Cập nhật Session
        session.setStatus(Status.ENDED);
        session.setEndedAt(now);

        // 2. Mở khoá máy tính trở lại AVAILABLE
        Computer computer = session.getComputer();
        computer.setStatus(Computer.Status.AVAILABLE);
        computerRepository.save(computer);

        // 3. Tính toán hoàn trả số phút chuẩn Standard chưa sử dụng về tài khoản
        Account account = session.getAccount();
        long remainingMinutesUntilExpiry = Math.max(0, Duration.between(now, session.getExpiresAt()).toMinutes());

        int refundStandardMinutes;
        BigDecimal computerPrice = computer.getPricePerHour();
        if (computerPrice == null || computerPrice.compareTo(BigDecimal.ZERO) <= 0 || computerPrice.compareTo(BASE_PRICE_PER_HOUR) == 0) {
            refundStandardMinutes = (int) remainingMinutesUntilExpiry;
        } else {
            refundStandardMinutes = BigDecimal.valueOf(remainingMinutesUntilExpiry)
                    .multiply(computerPrice)
                    .divide(BASE_PRICE_PER_HOUR, 0, RoundingMode.FLOOR)
                    .intValue();
        }

        // Đảm bảo số phút hoàn trả không vượt quá số phút khả dụng trước đó của tài khoản
        int newRemainingMinutes = Math.min(account.getRemainingMinutes(), Math.max(0, refundStandardMinutes));

        account.setRemainingMinutes(newRemainingMinutes);
        accountRepository.save(account);

        // 4. Thu hồi Refresh Token của khách hàng khi phiên kết thúc (B3)
        refreshTokenRepository.deleteByAccountId(account.getId());

        Session updatedSession = sessionRepository.save(session);
        realtimeNotificationService.broadcastComputerStatus(computer);
        auditLogService.log("END_SESSION", "Session", sessionId,
                "Kết thúc phiên máy " + computer.getCode() + " cho khách " + account.getPhone() + ", số phút còn lại: " + newRemainingMinutes);
        return SessionResponse.fromEntity(updatedSession);
    }

    /**
     * 3. GIA HẠN THÊM GIỜ CHƠI (extendSession)
     * Dùng khi khách nạp thêm giờ trong lúc đang chơi game mà không làm gián đoạn phiên.
     */
    @Transactional
    public SessionResponse extendSession(Long sessionId, ExtendSessionRequest request) {
        if (request.getExtraMinutes() <= 0) {
            throw new IllegalArgumentException("Số phút nạp thêm phải lớn hơn 0!");
        }

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + sessionId));

        if (session.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("Không thể gia hạn cho phiên chơi đã kết thúc!");
        }

        // Tịnh tiến thời điểm hết hạn của phiên quy đổi theo đơn giá máy đang ngồi
        long extraMachineMinutes = calculatePlayableMinutes(request.getExtraMinutes(), session.getComputer().getPricePerHour());
        session.setExpiresAt(session.getExpiresAt().plusMinutes(extraMachineMinutes));

        // Đồng thời cộng thêm phút chuẩn vào tài khoản khách
        Account account = session.getAccount();
        account.setRemainingMinutes(account.getRemainingMinutes() + request.getExtraMinutes());
        accountRepository.save(account);

        Session updated = sessionRepository.save(session);
        return SessionResponse.fromEntity(updated);
    }

    /**
     * 4. TRA CỨU PHIÊN ACTIVE BẰNG MÃ MÁY (Phục vụ tính năng quét mã QR)
     */
    @Transactional(readOnly = true)
    public SessionResponse getActiveSessionByComputerCode(String computerCode) {
        Session session = sessionRepository.findByComputerCodeAndStatus(computerCode, Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Máy tính [" + computerCode + "] hiện không có phiên chơi nào đang hoạt động!"));
        return SessionResponse.fromEntity(session);
    }

    /**
     * 4b. KIỂM TRA TRẠNG THÁI MÁY TRẠM CÔNG KHAI (Phục vụ quét mã QR)
     * Trả về thông tin cơ bản của máy và cờ hasActiveSession, không chứa dữ liệu cá nhân.
     */
    @Transactional(readOnly = true)
    public SessionCheckResponse checkComputerSession(String computerCode) {
        if (computerCode == null || computerCode.isBlank()) {
            throw new IllegalArgumentException("Mã máy tính không được để trống!");
        }
        Computer computer = computerRepository.findByCode(computerCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã = " + computerCode.trim()));

        boolean hasActive = sessionRepository.findByComputerCodeAndStatus(computer.getCode(), Status.ACTIVE).isPresent();

        return new SessionCheckResponse(
                computer.getCode(),
                computer.getZone(),
                computer.getPricePerHour(),
                computer.getStatus(),
                hasActive
        );
    }

    /**
     * 5. LẤY CHI TIẾT 1 PHIÊN THEO ID
     */
    @Transactional(readOnly = true)
    public SessionResponse getSessionById(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + id));
        return SessionResponse.fromEntity(session);
    }

    /**
     * 6. LẤY DANH SÁCH TẤT CẢ PHIÊN (Hỗ trợ lọc theo trạng thái, VD: status=ACTIVE để xem các máy đang chơi)
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getAllSessions(Status status) {
        List<Session> list = (status != null)
                ? sessionRepository.findByStatusOrderByStartedAtDesc(status)
                : sessionRepository.findAll();

        return list.stream()
                .map(SessionResponse::fromEntity)
                .toList();
    }

    /**
     * 6b. LẤY DANH SÁCH TẤT CẢ PHIÊN CÓ PHÂN TRANG & SẮP XẾP
     */
    @Transactional(readOnly = true)
    public PageResponse<SessionResponse> getAllSessions(Status status, Pageable pageable) {
        Page<Session> sessionPage = (status != null)
                ? sessionRepository.findByStatus(status, pageable)
                : sessionRepository.findAll(pageable);

        return PageResponse.fromPage(sessionPage, SessionResponse::fromEntity);
    }

    /**
     * 7. LẤY LỊCH SỬ CHƠI CỦA 1 KHÁCH HÀNG
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByAccountId(Long accountId) {
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng với ID = " + accountId);
        }

        return sessionRepository.findByAccountIdOrderByStartedAtDesc(accountId)
                .stream()
                .map(SessionResponse::fromEntity)
                .toList();
    }

    /**
     * 7b. LẤY LỊCH SỬ CHƠI CỦA 1 KHÁCH HÀNG CÓ PHÂN TRANG
     */
    @Transactional(readOnly = true)
    public PageResponse<SessionResponse> getSessionsByAccountId(Long accountId, Pageable pageable) {
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng với ID = " + accountId);
        }

        Page<Session> sessionPage = sessionRepository.findByAccountId(accountId, pageable);
        return PageResponse.fromPage(sessionPage, SessionResponse::fromEntity);
    }

    /**
     * 7c. LẤY LỊCH SỬ PHIÊN CHƠI CỦA 1 MÁY TÍNH CÓ PHÂN TRANG
     */
    @Transactional(readOnly = true)
    public PageResponse<SessionResponse> getSessionsByComputerId(Long computerId, Pageable pageable) {
        if (!computerRepository.existsById(computerId)) {
            throw new ResourceNotFoundException("Không tìm thấy máy tính với ID = " + computerId);
        }

        Page<Session> sessionPage = sessionRepository.findByComputerId(computerId, pageable);
        return PageResponse.fromPage(sessionPage, SessionResponse::fromEntity);
    }

    /**
     * 8. TỰ ĐỘNG ĐÓNG PHIÊN HẾT GIỜ (Dành cho @Scheduled job)
     * Sử dụng Propagation.REQUIRES_NEW để mỗi phiên chạy trong 1 transaction độc lập,
     * tránh lỗi ở 1 phiên làm rollback cả mẻ quét của Scheduler.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void autoEndExpiredSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || session.getStatus() != Status.ACTIVE) {
            return; // Đã kết thúc hoặc không tồn tại
        }

        // 1. Cập nhật Session sang ENDED
        session.setStatus(Status.ENDED);
        // Gán thời điểm kết thúc thực tế là mốc hết hạn
        session.setEndedAt(session.getExpiresAt());

        // 2. Mở khoá máy tính trở lại AVAILABLE
        Computer computer = session.getComputer();
        if (computer != null) {
            computer.setStatus(Computer.Status.AVAILABLE);
            computerRepository.save(computer);
        }

        // 3. Khách đã chơi hết trọn vẹn số giờ dự kiến, cập nhật remainingMinutes = 0
        Account account = session.getAccount();
        if (account != null) {
            account.setRemainingMinutes(0);
            accountRepository.save(account);
            // 4. Thu hồi Refresh Token của khách hàng khi phiên hết hạn tự động (B3)
            refreshTokenRepository.deleteByAccountId(account.getId());
        }

        sessionRepository.save(session);
        if (computer != null) {
            realtimeNotificationService.broadcastComputerStatus(computer);
        }
        log.info("UC-5 Scheduler: Tự động đóng phiên hết giờ [ID={}] trên máy [{}]",
                session.getId(), (computer != null ? computer.getCode() : "N/A"));
    }

    /**
     * 9. KHÁCH HÀNG ĐĂNG NHẬP MÁY TRẠM — MỞ PHIÊN CHƠI (UC-2)
     * Xác thực thông tin khách bằng SĐT + Mật khẩu, kiểm tra máy trống và mở phiên chơi.
     */
    @Transactional
    public SessionResponse loginAndStartSession(ComputerLoginRequest request) {
        // 1. Validate đầu vào
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống!");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống!");
        }
        if (request.getComputerCode() == null || request.getComputerCode().isBlank()) {
            throw new IllegalArgumentException("Mã máy tính không được để trống!");
        }

        // 2. Validate tài khoản khách hàng
        Account account = accountRepository.findByPhone(request.getPhone().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với số điện thoại: " + request.getPhone()));

        // Kiểm tra mật khẩu bằng BCrypt
        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác!");
        }

        // Chỉ tài khoản khách hàng (CUSTOMER) mới được đăng nhập mở phiên chơi máy trạm
        if (account.getRole() != Account.Role.CUSTOMER) {
            throw new IllegalArgumentException("Chỉ tài khoản khách hàng mới có thể đăng nhập mở máy chơi game!");
        }

        // Kiểm tra số dư thời gian chơi
        if (account.getRemainingMinutes() <= 0) {
            throw new IllegalArgumentException("Tài khoản đã hết thời gian chơi! Vui lòng nạp thêm giờ trước khi mở máy.");
        }

        // Quy tắc: 1 khách chỉ được mở tối đa 1 phiên ACTIVE cùng thời điểm
        if (sessionRepository.existsByAccountIdAndStatus(account.getId(), Status.ACTIVE)) {
            throw new IllegalStateException("Tài khoản này đang có phiên chơi tại máy khác! Không thể chơi 2 máy cùng lúc.");
        }

        // 3. Validate máy tính (Dùng Pessimistic Lock để chống 2 khách cùng đăng nhập 1 máy cùng lúc)
        Computer computer = computerRepository.findByCodeWithLock(request.getComputerCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã: " + request.getComputerCode()));

        if (computer.getStatus() != Computer.Status.AVAILABLE) {
            throw new IllegalStateException("Máy tính [" + computer.getCode() + "] hiện không khả dụng! Trạng thái: " + computer.getStatus());
        }

        if (sessionRepository.existsByComputerIdAndStatus(computer.getId(), Status.ACTIVE)) {
            throw new IllegalStateException("Máy tính [" + computer.getCode() + "] đang có phiên chơi đang hoạt động!");
        }

        // 4. Khởi tạo và kích hoạt phiên chơi
        LocalDateTime now = LocalDateTime.now();
        Session session = new Session();
        session.setAccount(account);
        session.setComputer(computer);
        session.setStartedAt(now);

        // Quy đổi số phút chơi thực tế theo Dynamic Tariff dựa trên đơn giá máy
        long playableMinutes = calculatePlayableMinutes(account.getRemainingMinutes(), computer.getPricePerHour());
        session.setExpiresAt(now.plusMinutes(playableMinutes));
        session.setStatus(Status.ACTIVE);

        // Khóa máy tính sang IN_USE
        computer.setStatus(Computer.Status.IN_USE);
        computerRepository.save(computer);

        Session savedSession = sessionRepository.save(session);
        realtimeNotificationService.broadcastComputerStatus(computer);
        auditLogService.log(account.getPhone(), account.getRole().name(), "LOGIN_START_SESSION", "Session", savedSession.getId(),
                "Khách hàng tự đăng nhập tại máy " + computer.getCode(), null);
        log.info("UC-2 Login: Khách hàng [{}] đăng nhập mở máy [{}] thành công. Phiên: [ID={}], hạn: {}",
                account.getPhone(), computer.getCode(), savedSession.getId(), savedSession.getExpiresAt());
        return SessionResponse.fromEntity(savedSession);
    }

    /**
     * 10. CHUYỂN MÁY TÍNH CHO KHÁCH HÀNG (UC-6)
     * Giữ nguyên phiên chơi và các đơn hàng PENDING.
     * Quy đổi thời gian hết hạn mới theo tỉ lệ đơn giá giữa 2 máy (Dynamic Tariff).
     */
    @Transactional
    public SessionResponse transferComputer(Long sessionId, TransferComputerRequest request) {
        // 1. Kiểm tra phiên chơi
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chơi với ID = " + sessionId));

        if (session.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("Chỉ có thể chuyển máy cho phiên chơi đang hoạt động (ACTIVE)!");
        }

        Computer oldComputer = session.getComputer();

        // 2. Tìm máy tính mới theo ID hoặc Code
        Computer newComputer = findTargetComputer(request);

        // Kiểm tra không chuyển sang chính máy đang ngồi
        if (newComputer.getId().equals(oldComputer.getId())) {
            throw new IllegalArgumentException("Máy tính mới phải khác máy tính đang sử dụng hiện tại!");
        }

        // Kiểm tra máy mới phải AVAILABLE
        if (newComputer.getStatus() != Computer.Status.AVAILABLE) {
            throw new IllegalStateException("Máy tính đích [" + newComputer.getCode() + "] hiện không khả dụng! Trạng thái: " + newComputer.getStatus());
        }

        // Đảm bảo máy mới không có phiên ACTIVE sót lại
        if (sessionRepository.existsByComputerIdAndStatus(newComputer.getId(), Status.ACTIVE)) {
            throw new IllegalStateException("Máy tính đích [" + newComputer.getCode() + "] đang có phiên chơi đang hoạt động!");
        }

        LocalDateTime now = LocalDateTime.now();

        // 3. THUẬT TOÁN QUY ĐỔI GIỜ ĐỘNG (Dynamic Tariff Calculation)
        // Tính số phút còn lại thực tế của phiên máy cũ
        long remainingMinutes = Math.max(0, Duration.between(now, session.getExpiresAt()).toMinutes());

        BigDecimal oldPrice = oldComputer.getPricePerHour();
        BigDecimal newPrice = newComputer.getPricePerHour();

        long convertedMinutes = remainingMinutes;
        if (oldPrice.compareTo(BigDecimal.ZERO) > 0 && newPrice.compareTo(BigDecimal.ZERO) > 0) {
            // newMinutes = remainingMinutes * (oldPrice / newPrice)
            convertedMinutes = BigDecimal.valueOf(remainingMinutes)
                    .multiply(oldPrice)
                    .divide(newPrice, 0, RoundingMode.FLOOR)
                    .longValue();

            session.setExpiresAt(now.plusMinutes(convertedMinutes));
        }

        // 4. CẬP NHẬT TRẠNG THÁI MÁY CŨ VÀ MÁY MỚI
        if (request.isMarkOldAsMaintenance()) {
            oldComputer.setStatus(Computer.Status.MAINTENANCE);
        } else {
            oldComputer.setStatus(Computer.Status.AVAILABLE);
        }
        computerRepository.save(oldComputer);

        newComputer.setStatus(Computer.Status.IN_USE);
        computerRepository.save(newComputer);

        // 5. GẮN MÁY MỚI VÀO PHIÊN HIỆN TẠI (Đơn hàng PENDING tự động đi theo phiên)
        session.setComputer(newComputer);
        Session savedSession = sessionRepository.save(session);
        realtimeNotificationService.broadcastComputerStatus(oldComputer);
        realtimeNotificationService.broadcastComputerStatus(newComputer);
        auditLogService.log("TRANSFER_COMPUTER", "Session", sessionId,
                "Chuyển phiên từ " + oldComputer.getCode() + " sang " + newComputer.getCode() + " (quy đổi: " + convertedMinutes + " phút, lý do: " + request.getReason() + ")");
        log.info("UC-6 Transfer: Chuyển máy thành công cho phiên [ID={}]: từ máy [{}] sang máy [{}]. Thời lượng quy đổi: {} phút",
                sessionId, oldComputer.getCode(), newComputer.getCode(), convertedMinutes);

        return SessionResponse.fromEntity(savedSession);
    }

    // Helper method tìm máy đích theo request (có Pessimistic Lock)
    private Computer findTargetComputer(TransferComputerRequest request) {
        if (request.getToComputerId() != null) {
            return computerRepository.findByIdWithLock(request.getToComputerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính đích với ID = " + request.getToComputerId()));
        } else if (request.getToComputerCode() != null && !request.getToComputerCode().isBlank()) {
            return computerRepository.findByCodeWithLock(request.getToComputerCode().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính đích với mã = " + request.getToComputerCode()));
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp toComputerId hoặc toComputerCode của máy đích!");
        }
    }

    // --- HÀM PHỤ TRỢ (HELPER METHOD) TÌM MÁY THEO ID HOẶC THEO CODE (có Pessimistic Lock) ---
    private Computer findComputerFromRequest(StartSessionRequest request) {
        if (request.getComputerId() != null) {
            return computerRepository.findByIdWithLock(request.getComputerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với ID = " + request.getComputerId()));
        } else if (request.getComputerCode() != null && !request.getComputerCode().isBlank()) {
            return computerRepository.findByCodeWithLock(request.getComputerCode().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã = " + request.getComputerCode()));
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp computerId hoặc computerCode để mở máy!");
        }
    }
}
