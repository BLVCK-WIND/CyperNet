package com.cybernet.internet_cafe_management.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Value("${spring.flyway.enabled:true}")
    private boolean enabled;

    @Value("${spring.flyway.baseline-on-migrate:true}")
    private boolean baselineOnMigrate;

    @Value("${spring.flyway.baseline-version:0}")
    private String baselineVersion;

    @Value("${spring.flyway.locations:classpath:db/migration}")
    private String locations;

    @Bean
    public Flyway flyway(DataSource dataSource) {
        if (!enabled) {
            log.info("Flyway migration is disabled via configuration");
            return null;
        }

        log.info("Initializing Flyway database migration [locations={}, baselineOnMigrate={}, baselineVersion={}]",
                locations, baselineOnMigrate, baselineVersion);

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(locations)
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .load();

        flyway.migrate();
        log.info("Flyway migration completed successfully. Current schema version: {}",
                flyway.info().current() != null ? flyway.info().current().getVersion().getVersion() : "none");

        return flyway;
    }
}
