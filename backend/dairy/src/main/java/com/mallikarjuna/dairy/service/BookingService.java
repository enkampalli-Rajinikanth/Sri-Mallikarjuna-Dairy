
package com.mallikarjuna.dairy.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mallikarjuna.dairy.dto.BookingRequest;
import com.mallikarjuna.dairy.entity.Booking;
import com.mallikarjuna.dairy.entity.Customer;
import com.mallikarjuna.dairy.entity.Product;
import com.mallikarjuna.dairy.repository.BookingRepository;
import com.mallikarjuna.dairy.repository.CustomerRepository;
import com.mallikarjuna.dairy.repository.ProductRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public BookingService(
            BookingRepository bookingRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository) {

        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest request) {

    	// 1. Find existing customer using phone number
    	Customer customer =
    	        customerRepository.findByPhone(request.getPhone());

    	// 2. Create new customer if not available
    	if (customer == null) {

    	    customer = new Customer();

    	    customer.setName(request.getName());
    	    customer.setPhone(request.getPhone());
    	    customer.setAddress(request.getAddress());
    	    customer.setArea(request.getArea());

    	    customer = customerRepository.save(customer);

    	} else {

    	    // Update address if customer provides a new address
    	    if (request.getAddress() != null
    	            && !request.getAddress().isBlank()) {

    	        customer.setAddress(request.getAddress());
    	        customer.setArea(request.getArea());
    	    }

    	    customer = customerRepository.save(customer);
    	}

        // 3. Find product using product ID
        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() ->
                    new RuntimeException("Product not found"));

        // 4. Validate product and quantity
        if (!product.isAvailable()) {
            throw new RuntimeException("Product is unavailable");
        }

        if (request.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }

        // 5. Calculate total using database product price
        BigDecimal total = BigDecimal.valueOf(product.getPrice())
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        // 6. Create booking
        Booking booking = new Booking();

        booking.setCustomer(customer);
        booking.setProduct(product);
        booking.setQuantity(request.getQuantity());
        booking.setTotalAmount(total);
        booking.setDeliveryType(request.getDeliveryType());
        booking.setStatus("New");
        booking.setNotes(request.getNotes());
        booking.setBookingDate(LocalDateTime.now());

        // 7. Save booking
        return bookingRepository.save(booking);
    }
    @Transactional(readOnly = true)
    public List<Booking> getCustomerBookings(String phone) {

        return bookingRepository
                .findByCustomer_PhoneOrderByBookingDateDesc(phone);
    }

public java.util.List<Booking> getAllBookings() {

    return bookingRepository.findAll();
}
public Booking updateStatus(Long id, String status) {

    Booking booking = bookingRepository.findById(id)
            .orElseThrow(() ->
                new RuntimeException("Booking not found"));

    if (!status.equals("New") &&
        !status.equals("Delivered") &&
        !status.equals("Cancelled")) {

        throw new RuntimeException("Invalid booking status");
    }

    booking.setStatus(status);

    return bookingRepository.save(booking);
}
public String getCustomerNameByPhone(String phone) {

    Customer customer =
            customerRepository.findByPhone(phone);

    if (customer == null) {
        return null;
    }

    return customer.getName();
}
@Transactional
public Booking cancelBooking(Long bookingId) {

    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() ->
                new RuntimeException("Booking not found"));

    if ("Cancelled".equalsIgnoreCase(booking.getStatus())) {
        throw new RuntimeException("This order is already cancelled");
    }

    if ("Delivered".equalsIgnoreCase(booking.getStatus())) {
        throw new RuntimeException("Delivered orders cannot be cancelled");
    }

    booking.setStatus("Cancelled");

    return bookingRepository.save(booking);
}

}
