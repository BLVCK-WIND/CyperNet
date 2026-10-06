package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.ExtendSessionRequest;
import com.cybernet.internet_cafe_management.dto.request.StartSessionRequest;
import com.cybernet.internet_cafe_management.dto.response.SessionResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.Computer;
import com.cybernet.internet_cafe_management.entity.Session;
import com.cybernet.internet_cafe_management.entity.Session.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.ComputerRepository;
import com.cybernet.internet_cafe_management.repository.SessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final ComputerRepository computerRepository;
    private final AccountRepository accountRepository;

    // Dependency Injection qua Constructor
    public SessionService(SessionRepository sessionRepository,
                          ComputerRepository computerRepository,
                          AccountRepository accountRepository) {
        this.sessionRepository = sessionRepository;
        this.computerRepository = computerRepository;
        this.accountRepository = accountRepository;
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
        // Tự động tính thời điểm hết giờ dựa trên số phút khách đang có
        session.setExpiresAt(now.plusMinutes(account.getRemainingMinutes()));
        session.setStatus(Status.ACTIVE);

        // Đổi trạng thái máy tính sang IN_USE để khoá máy
        computer.setStatus(Computer.Status.IN_USE);
        computerRepository.save(computer);

        Session savedSession = sessionRepository.save(session);
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

        // 3. Tính toán trừ số phút khách thực sự đã chơi trong phiên này
        Account account = session.getAccount();
        long playedMinutes = Math.max(0, Duration.between(session.getStartedAt(), now).toMinutes());
        int newRemainingMinutes = (int) Math.max(0, account.getRemainingMinutes() - playedMinutes);

        account.setRemainingMinutes(newRemainingMinutes);
        accountRepository.save(account);

        Session updatedSession = sessionRepository.save(session);
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

        // Tịnh tiến thời điểm hết hạn của phiên
        session.setExpiresAt(session.getExpiresAt().plusMinutes(request.getExtraMinutes()));

        // Đồng thời cộng thêm phút vào tài khoản khách
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

    // --- HÀM PHỤ TRỢ (HELPER METHOD) TÌM MÁY THEO ID HOẶC THEO CODE ---
    private Computer findComputerFromRequest(StartSessionRequest request) {
        if (request.getComputerId() != null) {
            return computerRepository.findById(request.getComputerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với ID = " + request.getComputerId()));
        } else if (request.getComputerCode() != null && !request.getComputerCode().isBlank()) {
            return computerRepository.findByCode(request.getComputerCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy máy tính với mã = " + request.getComputerCode()));
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp computerId hoặc computerCode để mở máy!");
        }
    }
}
