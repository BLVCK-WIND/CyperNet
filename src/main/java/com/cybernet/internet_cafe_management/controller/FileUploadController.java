package com.cybernet.internet_cafe_management.controller;

import com.cybernet.internet_cafe_management.dto.response.FileUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Tag(name = "File & Asset Management", description = "APIs tải lên hình ảnh món ăn, avatar, xuất hóa đơn QR và VietQR động")
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * Tải lên hình ảnh (Món ăn, Avatar, Receipt)
     */
    @Operation(summary = "Tải lên tệp hình ảnh", description = "Tải ảnh món ăn, avatar lên máy chủ (hỗ trợ JPG, PNG, WEBP, tối đa 5MB). Yêu cầu quyền ADMIN hoặc STAFF.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được rỗng!");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Kích thước tệp vượt quá giới hạn 5MB!");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Định dạng tệp không hợp lệ! Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF.");
        }

        // Làm sạch tên thư mục nhằm chống path traversal
        String safeFolder = folder.replaceAll("[^a-zA-Z0-9_-]", "");
        if (safeFolder.isBlank()) {
            safeFolder = "general";
        }

        try {
            Path targetDir = Paths.get("uploads", safeFolder).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            }

            String uniqueFileName = UUID.randomUUID().toString() + extension;
            Path destinationPath = targetDir.resolve(uniqueFileName);

            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + safeFolder + "/" + uniqueFileName;
            log.info("Uploaded file successfully: {} -> {}", originalName, fileUrl);

            FileUploadResponse response = FileUploadResponse.builder()
                    .fileName(uniqueFileName)
                    .fileUrl(fileUrl)
                    .contentType(contentType)
                    .size(file.getSize())
                    .build();

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IOException ex) {
            log.error("Lỗi khi lưu trữ tệp tải lên: {}", ex.getMessage(), ex);
            throw new IllegalStateException("Không thể lưu trữ tệp lên máy chủ!");
        }
    }

    /**
     * Tạo chuỗi liên kết VietQR động phục vụ thanh toán quét mã
     */
    @Operation(summary = "Tạo mã QR thanh toán VietQR động", description = "Tạo URL hình ảnh mã QR VietQR theo chuẩn Napas247 phục vụ khách hàng thanh toán chuyển khoản.")
    @GetMapping("/vietqr")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, String>> generateVietQr(
            @RequestParam BigDecimal amount,
            @RequestParam String content,
            @RequestParam(defaultValue = "MBBank") String bankId,
            @RequestParam(defaultValue = "0901111111") String accountNo) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0!");
        }

        String encodedContent = URLEncoder.encode(content != null ? content : "Thanh toan CyberNet", StandardCharsets.UTF_8);
        // Mẫu VietQR chuẩn
        String qrImageUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s",
                bankId, accountNo, amount.toPlainString(), encodedContent);

        return ResponseEntity.ok(Map.of(
                "qrUrl", qrImageUrl,
                "amount", amount.toPlainString(),
                "accountNo", accountNo,
                "bankId", bankId,
                "content", content != null ? content : ""
        ));
    }
}
