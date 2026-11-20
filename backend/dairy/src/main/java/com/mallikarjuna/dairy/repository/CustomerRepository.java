
package com.mallikarjuna.dairy.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mallikarjuna.dairy.entity.Customer;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {

    Customer findByPhone(String phone);
}
