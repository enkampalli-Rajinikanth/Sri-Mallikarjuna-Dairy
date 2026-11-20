
package com.mallikarjuna.dairy.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mallikarjuna.dairy.entity.Product;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    Optional<Product> findByNameIgnoreCase(String name);

}
