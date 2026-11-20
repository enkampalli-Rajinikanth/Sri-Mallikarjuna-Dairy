
package com.mallikarjuna.dairy.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mallikarjuna.dairy.entity.Product;
import com.mallikarjuna.dairy.repository.ProductRepository;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Get all products
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Add new product
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Product product) {

        if (product.getName() == null
                || product.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Product name is required");
        }

        if (product.getPrice() <= 0) {
            return ResponseEntity.badRequest()
                    .body("Price must be greater than zero");
        }

        if (product.getUnit() == null
                || product.getUnit().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Product unit is required");
        }

        product.setId(null);
        product.setAvailable(true);

        Product saved = productRepository.save(product);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Update product
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody Product updatedProduct) {

        return productRepository.findById(id)
                .map(product -> {

                    product.setName(updatedProduct.getName());
                    product.setPrice(updatedProduct.getPrice());
                    product.setUnit(updatedProduct.getUnit());

                    Product saved = productRepository.save(product);

                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    // Remove product (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeProduct(@PathVariable Long id) {

        return productRepository.findById(id)
                .map(product -> {

                    product.setAvailable(false);
                    productRepository.save(product);

                    return ResponseEntity.ok(
                            "Product removed successfully"
                    );
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    // Enable or disable product
    @PatchMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {

        return productRepository.findById(id)
                .map(product -> {

                    product.setAvailable(available);

                    Product saved = productRepository.save(product);

                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }
}
