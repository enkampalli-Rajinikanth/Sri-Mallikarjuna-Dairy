package com.mallikarjuna.dairy.controller;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mallikarjuna.dairy.dto.BookingRequest;
import com.mallikarjuna.dairy.entity.Booking;
import com.mallikarjuna.dairy.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @RequestBody BookingRequest request) {

        Booking booking = bookingService.createBooking(request);

        return new ResponseEntity<>(
                booking, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings() {

        return ResponseEntity.ok(
                bookingService.getAllBookings());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        Booking booking = bookingService.updateStatus(
                id, request.get("status"));

        return ResponseEntity.ok(booking);
    }
    @GetMapping("/customer/{phone}")
    public ResponseEntity<?> getCustomerBookings(
            @PathVariable String phone) {

        return ResponseEntity.ok(
                bookingService.getCustomerBookings(phone));
    }
}