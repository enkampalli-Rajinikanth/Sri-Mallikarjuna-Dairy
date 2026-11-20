
package com.mallikarjuna.dairy.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.mallikarjuna.dairy.entity.Product;
import com.mallikarjuna.dairy.repository.ProductRepository;

@Component
public class ProductDataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;

    public ProductDataLoader(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {

        if (productRepository.count() == 0) {

            List<Product> products = List.of(
                new Product("Cow Milk", 60.0, "1 Litre", true),
                new Product("Buffalo Milk", 80.0, "1 Litre", true),
                new Product("Full Cream Milk", 70.0, "1 Litre", true),
                new Product("Curd", 40.0, "500 Grams", true),
                new Product("Paneer", 100.0, "250 Grams", true),
                new Product("Ghee", 300.0, "500 Grams", true)
            );

            productRepository.saveAll(products);

            System.out.println("Dairy products inserted successfully!");
        }
    }
}
