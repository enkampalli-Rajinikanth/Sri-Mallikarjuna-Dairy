
package com.mallikarjuna.dairy.ai;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.mallikarjuna.dairy.entity.Product;
import com.mallikarjuna.dairy.repository.ProductRepository;

@Service
public class AiService {

    private final RestClient restClient;
    private final String model;
    private final ProductRepository productRepository;

    public AiService(
            @Value("${ollama.api.url}") String url,
            @Value("${ollama.model}") String model,
            ProductRepository productRepository) {

        this.restClient = RestClient.builder()
                .baseUrl(url)
                .build();

        this.model = model;
        this.productRepository = productRepository;
    }

    public String askAI(String question) {

        try {

            // Fetch products from PostgreSQL
            List<Product> products =
                    productRepository.findAll();

            String productDetails = products.stream()
                    .map(product ->
                            "Product: " + product.getName()
                            + ", Price: Rs." + product.getPrice()
                            + " per " + product.getUnit()
                            + ", Available: "
                            + (product.isAvailable()
                                    ? "Yes" : "No")
                    )
                    .collect(Collectors.joining("\n"));

            // Prepare AI request
            Map<String, Object> request = Map.of(
                    "model", model,

                    "messages", List.of(

                            Map.of(
                                    "role", "system",
                                    "content", """
                                            You are the official AI assistant
                                            of Sri Mallikarjuna Dairy.

                                            We sell fresh buffalo milk
                                            and fresh curd.

                                            Help customers with:
                                            1. Product prices
                                            2. Product availability
                                            3. Dairy products
                                            4. Home delivery
                                            5. Customer pickup
                                            6. Booking information

                                            Use the following product
                                            information from our database:

                                            """
                                            + productDetails
                                            + """

                                            Rules:
                                            - Use database prices only.
                                            - Never invent prices.
                                            - Never claim an unavailable
                                              product is available.
                                            - Do not invent stock quantities.
                                            - We support home delivery
                                              and customer pickup.
                                            - Be polite and friendly.
                                            - Answer dairy-related questions only.
                                            """
                            ),

                            Map.of(
                                    "role", "user",
                                    "content", question
                            )
                    ),

                    "stream", false
            );

            // Call Ollama
            OllamaResponse response = restClient.post()
                    .uri("/api/chat")
                    .body(request)
                    .retrieve()
                    .body(OllamaResponse.class);

            if (response == null
                    || response.message() == null
                    || response.message().content() == null) {

                throw new IllegalStateException(
                        "Empty response from Ollama"
                );
            }

            return response.message().content();

        } catch (Exception e) {

            e.printStackTrace();

            throw new RuntimeException(
                    "AI service failed: " + e.getMessage(), e
            );
        }
    }

    private record OllamaResponse(Message message) {

        private record Message(
                String role,
                String content
        ) {
        }
    }
}
