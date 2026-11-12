package com.cybernet.internet_cafe_management;

import org.springframework.test.context.*;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.core.env.MapPropertySource;
import java.util.*;
import java.nio.file.*;
import java.sql.*;

/** Each legacy Spring test class gets its own migrated database by default. */
public class DisposableDatabaseContextCustomizerFactory implements ContextCustomizerFactory {
    @Override public ContextCustomizer createContextCustomizer(Class<?> testClass, List<ContextConfigurationAttributes> attributes) {
        if (testClass == IsolatedBillingIntegrationTest.class) return null;
        return new IsolatedContext(testClass.getName());
    }
    private record IsolatedContext(String testClass) implements ContextCustomizer {
        @Override public void customizeContext(ConfigurableApplicationContext context, MergedContextConfiguration merged) {
            try {
                Properties properties = new Properties();
                try (var reader = Files.newBufferedReader(Path.of("src/main/resources/application-dev.properties"))) { properties.load(reader); }
                var match = java.util.regex.Pattern.compile("(jdbc:mysql://[^/]+/)[^?]*(.*)").matcher(properties.getProperty("spring.datasource.url"));
                if (!match.matches()) throw new IllegalStateException("Expected local MySQL JDBC settings");
                String schema = "cybernet_suite_" + UUID.randomUUID().toString().replace("-", "");
                String server = match.group(1) + match.group(2);
                String url = match.group(1) + schema + match.group(2);
                String user = properties.getProperty("spring.datasource.username"), password = properties.getProperty("spring.datasource.password");
                if (!schema.matches("cybernet_suite_[a-f0-9]{32}")) throw new IllegalStateException("Invalid isolated schema");
                try (var connection = DriverManager.getConnection(server, user, password); var statement = connection.createStatement()) {
                    statement.execute("CREATE DATABASE " + schema + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                }
                Runnable cleanup = () -> {
                    try (var connection = DriverManager.getConnection(server, user, password); var statement = connection.createStatement()) {
                        statement.execute("DROP DATABASE IF EXISTS " + schema);
                    } catch (SQLException error) { System.err.println("Cleanup needs review for isolated schema " + schema); }
                };
                Runtime.getRuntime().addShutdownHook(new Thread(cleanup, "isolated-db-cleanup"));
                context.addApplicationListener(event -> { if (event instanceof ContextClosedEvent) cleanup.run(); });
                context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("isolated-test-database", Map.of(
                        "spring.datasource.url", url, "spring.datasource.username", user, "spring.datasource.password", password,
                        "spring.jpa.hibernate.ddl-auto", "validate", "spring.flyway.baseline-on-migrate", "false",
                        "spring.jpa.show-sql", "false", "spring.datasource.hikari.maximum-pool-size", "4", "spring.datasource.hikari.minimum-idle", "0")));
            } catch (Exception error) { throw new IllegalStateException("Cannot initialize isolated test database", error); }
        }
    }
}
