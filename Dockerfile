# ==============================================================================
# Multi-Stage Dockerfile for CyberNet Internet Cafe Management System
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build JAR with Maven & Eclipse Temurin JDK 17
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy project definition first to leverage Docker layer caching for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Build the Spring Boot executable artifact without running tests (tests run in CI/CD)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime with Eclipse Temurin JRE 17
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine

# Metadata
LABEL maintainer="CyberNet Team"
LABEL description="CyberNet Internet Cafe Management System Backend Service"

# Security: Run as a non-privileged system user instead of root
RUN addgroup -S cybernet && adduser -S cybernet -G cybernet

WORKDIR /app

# Prepare directories with proper ownership
RUN mkdir -p /app/logs && chown -R cybernet:cybernet /app

# Copy compiled JAR from builder stage
COPY --from=builder --chown=cybernet:cybernet /build/target/*.jar /app/app.jar

# Switch to non-root user
USER cybernet

# Service port
EXPOSE 8080

# Production JVM optimizations for containerized environments:
# - UseContainerSupport: Automatically detects container CPU and RAM limits
# - MaxRAMPercentage=75.0: Allocates up to 75% of container RAM to JVM heap
# - java.security.egd: Faster secure random number generation
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
