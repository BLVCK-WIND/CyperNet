package com.cybernet.internet_cafe_management.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.time.ZoneId;
import java.util.TimeZone;

public class CafeTimeZoneInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    public static final ZoneId CAFE_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        // DATETIME and the public API both use cafe wall time without an offset.
        // Set the JVM zone before Hibernate creates its timestamp generators.
        TimeZone.setDefault(TimeZone.getTimeZone(CAFE_ZONE));
    }
}
