package com.cybernet.internet_cafe_management;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.io.File;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class Phase5LoggingIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Test
    @DisplayName("TC-1: Request bất kỳ tự động sinh header X-Trace-Id trong response")
    void testResponseContainsTraceIdHeader() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/auth/test-probe"))
                .andExpect(header().exists("X-Trace-Id"))
                .andExpect(header().string("X-Trace-Id", org.hamcrest.Matchers.notNullValue()));
    }

    @Test
    @DisplayName("TC-2: Request gửi kèm X-Trace-Id từ client -> Server tái sử dụng và phản hồi đúng traceId đó")
    void testClientSuppliedTraceIdIsPreserved() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String customTraceId = "my-custom-trace-007";

        mockMvc.perform(get("/api/auth/test-probe")
                        .header("X-Trace-Id", customTraceId))
                .andExpect(header().string("X-Trace-Id", customTraceId));
    }

    @Test
    @DisplayName("TC-3: Hệ thống tự động tạo thư mục logs và file cybernet.log từ Logback")
    void testLogFileCreation() {
        File logDir = new File("logs");
        assertTrue(logDir.exists() && logDir.isDirectory(), "Thư mục logs phải tồn tại");

        File appLog = new File("logs/cybernet.log");
        assertTrue(appLog.exists(), "File logs/cybernet.log phải được tạo ra");
        assertTrue(appLog.length() > 0, "File logs/cybernet.log phải chứa nội dung log");
    }
}
