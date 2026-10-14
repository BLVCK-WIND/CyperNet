package com.cybernet.internet_cafe_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InternetCafeManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(InternetCafeManagementApplication.class, args);
	}

}
