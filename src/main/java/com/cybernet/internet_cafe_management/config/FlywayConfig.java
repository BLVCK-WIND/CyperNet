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

    @Value("${spring.flyway.out-of-order:false}")
    private boolean outOfOrder;

    // This project declares Flyway directly; enforce migration before Hibernate validation.
    @Bean
    public static org.springframework.beans.factory.config.BeanFactoryPostProcessor migrateBeforeHibernate() {
        return factory -> {
            if (factory.containsBeanDefinition("entityManagerFactory")) {
                var definition = factory.getBeanDefinition("entityManagerFactory");
                var dependencies = new java.util.ArrayList<String>();
                if (definition.getDependsOn() != null) dependencies.addAll(java.util.Arrays.asList(definition.getDependsOn()));
                if (!dependencies.contains("flyway")) dependencies.add("flyway");
                definition.setDependsOn(dependencies.toArray(String[]::new));
            }
        };
    }

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
                .outOfOrder(outOfOrder)
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .load();

        flyway.migrate();
        log.info("Flyway migration completed successfully. Current schema version: {}",
                flyway.info().current() != null ? flyway.info().current().getVersion().getVersion() : "none");

        return flyway;
    }
}
