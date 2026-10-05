package com.cybernet.internet_cafe_management.service;

import com.cybernet.internet_cafe_management.dto.request.CreateTimePurchaseRequest;
import com.cybernet.internet_cafe_management.dto.response.TimePurchaseResponse;
import com.cybernet.internet_cafe_management.entity.Account;
import com.cybernet.internet_cafe_management.entity.TimePurchase;
import com.cybernet.internet_cafe_management.entity.TimePurchase.Status;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import com.cybernet.internet_cafe_management.repository.AccountRepository;
import com.cybernet.internet_cafe_management.repository.TimePurchaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TimePurchaseService {

    private final TimePurchaseRepository timePurchaseRepository;
    private final AccountRepository accountRepository;

    // Dependency Injection qua Constructor
    public TimePurchaseService(TimePurchaseRepository timePurchaseRepository, AccountRepository accountRepository) {
        this.timePurchaseRepository = timePurchaseRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * 1. Tạo yêu cầu mua giờ chơi mới (Trạng thái ban đầu luôn là PENDING_PAYMENT).
     * Được gọi khi khách quét QR chọn mua giờ trên điện thoại hoặc nhân viên tạo đơn tại quầy.
     */
    @Transactional
    public TimePurchaseResponse createTimePurchase(CreateTimePurchaseRequest request) {
        // Validate dữ liệu đầu vào cơ bản
        if (request.getMinutes() <= 0) {
            throw new IllegalArgumentException("Số phút nạp phải lớn hơn 0!");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0!");
        }
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Phương thức thanh toán không được để trống (chọn QR hoặc CASH)!");
        }

        // Tìm tài khoản khách hàng được cộng giờ
        Account customer = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng với ID = " + request.getAccountId()));

        // Chuyển đổi từ DTO sang Entity để chuẩn bị lưu vào Database
        TimePurchase timePurchase = new TimePurchase();
        timePurchase.setAccount(customer);
        timePurchase.setMinutes(request.getMinutes());
        timePurchase.setAmount(request.getAmount());
        timePurchase.setPaymentMethod(request.getPaymentMethod());
        timePurchase.setStatus(Status.PENDING_PAYMENT); // Mặc định là chờ thanh toán

        TimePurchase saved = timePurchaseRepository.save(timePurchase);
        return TimePurchaseResponse.fromEntity(saved);
    }

    /**
     * 2. Nhân viên xác nhận thanh toán (CONFIRM).
     * CỰC KỲ QUAN TRỌNG: Phải dùng @Transactional để đảm bảo tính nguyên tử (Atomicity).
     * Cả 2 thao tác: (1) Đổi trạng thái giao dịch thành CONFIRMED và (2) Cộng giờ cho khách
     * phải cùng thành công. Nếu 1 trong 2 gặp lỗi, DB sẽ tự rollback toàn bộ!
     */
    @Transactional
    public TimePurchaseResponse confirmTimePurchase(Long timePurchaseId, Long staffAccountId) {
        // Tìm giao dịch nạp giờ
        TimePurchase timePurchase = timePurchaseRepository.findById(timePurchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch mua giờ với ID = " + timePurchaseId));

        // Kiểm tra logic trạng thái: Chỉ đơn PENDING_PAYMENT mới được phép xác nhận
        if (timePurchase.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Giao dịch không ở trạng thái chờ thanh toán! Trạng thái hiện tại: " + timePurchase.getStatus());
        }

        // Tìm tài khoản nhân viên xác nhận
        Account staff = accountRepository.findById(staffAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên với ID = " + staffAccountId));

        // Kiểm tra quyền: Chỉ STAFF hoặc ADMIN mới được duyệt thanh toán
        if (staff.getRole() == Account.Role.CUSTOMER) {
            throw new IllegalArgumentException("Tài khoản này là Khách hàng, không có quyền duyệt thanh toán!");
        }

        // 1. Cập nhật thông tin xác nhận cho TimePurchase
        timePurchase.setStatus(Status.CONFIRMED);
        timePurchase.setConfirmedByStaff(staff);
        timePurchase.setConfirmedAt(LocalDateTime.now());

        // 2. CỘNG THÊM GIỜ CHƠI VÀO TÀI KHOẢN KHÁCH HÀNG
        Account customer = timePurchase.getAccount();
        customer.setRemainingMinutes(customer.getRemainingMinutes() + timePurchase.getMinutes());
        accountRepository.save(customer);

        // 3. Lưu giao dịch đã cập nhật
        TimePurchase updated = timePurchaseRepository.save(timePurchase);
        return TimePurchaseResponse.fromEntity(updated);
    }

    /**
     * 3. Huỷ giao dịch mua giờ (khi khách đổi ý hoặc quá thời gian không thanh toán).
     * Chỉ huỷ được khi đang ở trạng thái PENDING_PAYMENT.
     */
    @Transactional
    public TimePurchaseResponse cancelTimePurchase(Long timePurchaseId) {
        TimePurchase timePurchase = timePurchaseRepository.findById(timePurchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch mua giờ với ID = " + timePurchaseId));

        if (timePurchase.getStatus() != Status.PENDING_PAYMENT) {
            throw new IllegalStateException("Chỉ có thể huỷ giao dịch đang chờ thanh toán! Trạng thái hiện tại: " + timePurchase.getStatus());
        }

        timePurchase.setStatus(Status.CANCELLED);
        TimePurchase updated = timePurchaseRepository.save(timePurchase);
        return TimePurchaseResponse.fromEntity(updated);
    }

    /**
     * 4. Lấy chi tiết 1 giao dịch theo ID.
     */
    @Transactional(readOnly = true)
    public TimePurchaseResponse getTimePurchaseById(Long id) {
        TimePurchase timePurchase = timePurchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch mua giờ với ID = " + id));
        return TimePurchaseResponse.fromEntity(timePurchase);
    }

    /**
     * 5. Lấy danh sách giao dịch (hỗ trợ lọc theo trạng thái, VD: PENDING_PAYMENT).
     */
    @Transactional(readOnly = true)
    public List<TimePurchaseResponse> getAllTimePurchases(Status status) {
        List<TimePurchase> list = (status != null)
                ? timePurchaseRepository.findByStatusOrderByCreatedAtDesc(status)
                : timePurchaseRepository.findAll();

        return list.stream()
                .map(TimePurchaseResponse::fromEntity)
                .toList();
    }

    /**
     * 6. Lấy toàn bộ lịch sử nạp giờ của 1 tài khoản khách hàng cụ thể.
     */
    @Transactional(readOnly = true)
    public List<TimePurchaseResponse> getTimePurchasesByAccountId(Long accountId) {
        if (!accountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản khách hàng với ID = " + accountId);
        }

        return timePurchaseRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(TimePurchaseResponse::fromEntity)
                .toList();
    }
}
