
package com.mallikarjuna.dairy.repository;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;


import org.springframework.data.jpa.repository.JpaRepository;
import com.mallikarjuna.dairy.entity.Booking;

public interface BookingRepository
        extends JpaRepository<Booking, Long> {

	@EntityGraph(attributePaths = {"customer", "product"})
	List<Booking> findByCustomer_PhoneOrderByBookingDateDesc(
	        String phone);

}
