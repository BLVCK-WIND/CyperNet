package com.cybernet.internet_cafe_management;

import com.cybernet.internet_cafe_management.service.*;
import com.cybernet.internet_cafe_management.repository.*;
import com.cybernet.internet_cafe_management.entity.*;
import com.cybernet.internet_cafe_management.dto.request.*;
import com.cybernet.internet_cafe_management.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class DynamicZoneServiceTest {
    private final ComputerRepository computers = mock(ComputerRepository.class);
    private final ZoneRepository zones = mock(ZoneRepository.class);
    private final ComputerService service = new ComputerService(computers, zones,
            mock(SessionRepository.class), mock(OrderRepository.class), mock(RealtimeNotificationService.class));

    @Test void customCodesAreNormalizedAndValidatedWithoutChangingTariffs() {
        Zone zone = Zone.builder().code("VAL").active(true).defaultPricePerHour(BigDecimal.valueOf(20000)).build();
        when(zones.findByCodeIgnoreCase("VAL")).thenReturn(Optional.of(zone));
        when(computers.save(any())).thenAnswer(call -> call.getArgument(0));
        CreateComputerRequest request = new CreateComputerRequest("PC-NEW", BigDecimal.valueOf(15000), Computer.Status.AVAILABLE, "192.168.1.22", " val ");
        var response = service.createComputer(request);
        assertEquals("VAL", response.getZone());
        assertEquals(BigDecimal.valueOf(15000), response.getPricePerHour());
    }

    @Test void unknownAndInactiveAssignmentsAreRejected() {
        CreateComputerRequest request = new CreateComputerRequest("PC-NEW", BigDecimal.TEN, Computer.Status.AVAILABLE, "192.168.1.22", "VAL");
        assertThrows(ResourceNotFoundException.class, () -> service.createComputer(request));
        when(zones.findByCodeIgnoreCase("VAL")).thenReturn(Optional.of(Zone.builder().code("VAL").active(false).build()));
        assertThrows(IllegalArgumentException.class, () -> service.createComputer(request));
        verify(computers, never()).save(any());
    }

    @Test void existingInactiveAssignmentAllowsUnrelatedUpdates() {
        Computer computer = new Computer(); computer.setId(1L); computer.setZone("VAL");
        computer.setCode("PC-01"); computer.setPricePerHour(BigDecimal.TEN);
        when(computers.findById(1L)).thenReturn(Optional.of(computer));
        when(computers.save(any())).thenAnswer(call -> call.getArgument(0));
        when(zones.findByCodeIgnoreCase("VAL")).thenReturn(Optional.of(Zone.builder().code("VAL").active(false).build()));
        UpdateComputerRequest request = UpdateComputerRequest.builder().zone("VAL").pricePerHour(BigDecimal.valueOf(15000)).build();
        assertEquals("VAL", service.updateComputer(1L, request).getZone());
    }
}
