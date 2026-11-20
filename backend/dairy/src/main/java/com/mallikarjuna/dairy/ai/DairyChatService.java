
package com.mallikarjuna.dairy.ai;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.mallikarjuna.dairy.dto.BookingRequest;
import com.mallikarjuna.dairy.entity.Booking;
import com.mallikarjuna.dairy.entity.Product;
import com.mallikarjuna.dairy.repository.ProductRepository;
import com.mallikarjuna.dairy.service.BookingService;

@Service
public class DairyChatService {

    private final ProductRepository productRepository;
    private final BookingService bookingService;
    private final AiService aiService;

    private final Map<String, ChatSession> sessions =
            new ConcurrentHashMap<>();

    public DairyChatService(
            ProductRepository productRepository,
            BookingService bookingService,
            AiService aiService) {

        this.productRepository = productRepository;
        this.bookingService = bookingService;
        this.aiService = aiService;
    }

    public AiResponse chat(String sessionId, String message) {

        if (sessionId == null || sessionId.isBlank()) {
            sessionId = UUID.randomUUID().toString();
        }

        if (message == null || message.isBlank()) {
            return new AiResponse(
                    sessionId,
                    "Please enter your message."
            );
        }

        String input = message.trim();
        String lower = input.toLowerCase().trim();

        ChatSession session = sessions.computeIfAbsent(
                sessionId,
                id -> new ChatSession()
        );

        System.out.println("SESSION ID: " + sessionId);
        System.out.println("CURRENT STEP: " + session.getStep());
        System.out.println("MESSAGE: " + input);

        // =========================================
        // CANCEL BOOKING / CANCEL EXISTING ORDER
        // =========================================

        boolean cancelIntent =
                lower.equals("cancel my order")
                || lower.equals("cancel order")
                || lower.equals("cancel booking")
                || lower.equals("i want to cancel")
                || lower.equals("cancel");

        if (cancelIntent
                && !"CANCEL_ORDER_ID".equals(session.getStep())) {

            // Customer is at the beginning of a conversation.
            // Ask for the existing order ID.
            if ("START".equals(session.getStep())) {

                session.setStep("CANCEL_ORDER_ID");

                return new AiResponse(
                        sessionId,
                        "Sure! I can help you cancel an existing order.\n\n"
                        + "Please enter your Order ID."
                );

            } else {

                // Customer is in the middle of a new booking.
                // Cancel only the unfinished booking process.
                sessions.remove(sessionId);

                return new AiResponse(
                        sessionId,
                        "Your current booking process has been cancelled. "
                        + "You can start again whenever you like."
                );
            }
        }

        // =========================================
        // CHATBOT FLOW
        // =========================================

        switch (session.getStep()) {

            // =====================================
            // START
            // =====================================

        case "START":

            if (lower.equals("hi")
                    || lower.equals("hello")
                    || lower.equals("hey")) {

                return new AiResponse(
                        sessionId,
                        "Hello! Welcome to Sri Mallikarjuna Dairy. 🥛\n\n"
                        + "I can help you order milk, check prices, "
                        + "arrange delivery, track your orders and cancel orders.\n\n"
                        + "What would you like to do?"
                );
            }

            // Track existing orders
            if (lower.contains("track")
                    || lower.contains("tracking")
                    || lower.contains("order status")
                    || lower.contains("my orders")
                    || lower.contains("previous orders")
                    || lower.contains("order history")) {

                session.setStep("TRACK_PHONE");

                return new AiResponse(
                        sessionId,
                        "Sure! I can help you track your orders.\n\n"
                        + "Please enter your registered mobile number."
                );
            }

            // Start a new booking
            if (lower.equals("order")
                    || lower.equals("book")
                    || lower.contains("order milk")
                    || lower.contains("book milk")
                    || lower.contains("order curd")
                    || lower.contains("book curd")
                    || lower.contains("buy milk")
                    || lower.contains("buy curd")
                    || lower.contains("purchase milk")
                    || lower.contains("purchase curd")) {

                session.setStep("PRODUCT");

                return new AiResponse(
                        sessionId,
                        "Sure! Which product would you like?\n"
                        + getAvailableProducts()
                );
            }

            return new AiResponse(
                    sessionId,
                    aiService.askAI(input)
            );

            // =====================================
            // PRODUCT
            // =====================================

            case "PRODUCT":

                return selectProduct(
                        sessionId,
                        session,
                        input
                );

            // =====================================
            // QUANTITY
            // =====================================

            case "QUANTITY":

                return selectQuantity(
                        sessionId,
                        session,
                        input
                );

            // =====================================
            // DELIVERY
            // =====================================

            case "DELIVERY":

                return selectDelivery(
                        sessionId,
                        session,
                        lower
                );

            // =====================================
            // ADDRESS
            // =====================================

            case "ADDRESS":

                session.getBooking().setAddress(input);
                session.getBooking().setArea(input);

                session.setStep("PHONE");

                return new AiResponse(
                        sessionId,
                        "Please provide your mobile number for the order."
                );

            // =====================================
            // PHONE
            // =====================================

            case "PHONE": {

                if (!input.matches("[6-9][0-9]{9}")) {

                    return new AiResponse(
                            sessionId,
                            "Please enter a valid 10-digit Indian mobile number."
                    );
                }

                session.getBooking().setPhone(input);

                String existingName =
                        bookingService.getCustomerNameByPhone(input);

                if (existingName != null && !existingName.isBlank()) {

                    session.getBooking().setName(existingName);

                    session.setStep("CONFIRMATION");

                    return showSummary(sessionId, session);
                }

                session.setStep("NAME");

                return new AiResponse(
                        sessionId,
                        "You are a new customer. Please provide your name."
                );
            }

            // =====================================
            // NAME
            // =====================================

            case "NAME":

                session.getBooking().setName(input);

                session.setStep("CONFIRMATION");

                return showSummary(sessionId, session);

            // =====================================
            // CONFIRMATION
            // =====================================

            case "CONFIRMATION": {

                String reply = lower.trim()
                        .replaceAll("[^a-z ]", "")
                        .trim();

                if (reply.equals("yes")
                        || reply.equals("confirm")
                        || reply.equals("yes confirm")
                        || reply.equals("confirm order")
                        || reply.equals("yes please")
                        || reply.equals("yes i confirm")) {

                    try {

                        Booking booking = bookingService.createBooking(
                                session.getBooking()
                        );

                        sessions.remove(sessionId);

                        return new AiResponse(
                                sessionId,
                                "Booking confirmed! 🎉\n\n"
                                + "Your milk order has been successfully placed!\n\n"
                                + "Order ID: #" + booking.getId()
                                + "\nTotal Amount: Rs. "
                                + booking.getTotalAmount()
                                + "\nStatus: " + booking.getStatus()
                                + "\n\nThank you for choosing "
                                + "Sri Mallikarjuna Dairy! 🥛"
                        );

                    } catch (Exception e) {

                        e.printStackTrace();

                        return new AiResponse(
                                sessionId,
                                "Sorry, we could not complete your booking. Please try again."
                        );
                    }
                }

                if (reply.equals("no") || reply.equals("cancel")) {

                    sessions.remove(sessionId);

                    return new AiResponse(
                            sessionId,
                            "Your order has not been placed. "
                            + "You can start a new booking anytime."
                    );
                }

                return new AiResponse(
                        sessionId,
                        "Would you like to confirm your order? Please reply Yes or No."
                );
            }
            
            case "TRACK_PHONE":

                if (!input.matches("[6-9][0-9]{9}")) {

                    return new AiResponse(
                            sessionId,
                            "Please enter a valid 10-digit mobile number."
                    );
                }

                try {

                    List<Booking> bookings =
                            bookingService.getCustomerBookings(input);

                    session.setStep("START");

                    if (bookings.isEmpty()) {

                        return new AiResponse(
                                sessionId,
                                "No orders found for this mobile number."
                        );
                    }

                    StringBuilder result = new StringBuilder();

                    result.append("Your Order History 🥛\n\n");

                    for (Booking booking : bookings) {

                        result.append("Order ID: #")
                                .append(booking.getId())
                                .append("\nProduct: ")
                                .append(booking.getProduct().getName())
                                .append("\nQuantity: ")
                                .append(booking.getQuantity())
                                .append("\nAmount: Rs.")
                                .append(booking.getTotalAmount())
                                .append("\nStatus: ")
                                .append(booking.getStatus())
                                .append("\n----------------------\n");
                    }

                    return new AiResponse(
                            sessionId,
                            result.toString()
                    );

                } catch (Exception e) {

                    e.printStackTrace();

                    return new AiResponse(
                            sessionId,
                            "Sorry! Unable to retrieve your orders. Please try again."
                    );
                }

            // =====================================
            // CANCEL EXISTING ORDER
            // =====================================

            case "CANCEL_ORDER_ID":

                try {

                    Long bookingId = Long.parseLong(input.trim());

                    Booking booking =
                            bookingService.cancelBooking(bookingId);

                    sessions.remove(sessionId);

                    return new AiResponse(
                            sessionId,
                            "Your order has been successfully cancelled! 🎉\n\n"
                            + "Order ID: #" + booking.getId() + "\n"
                            + "Status: " + booking.getStatus()
                    );

                } catch (NumberFormatException e) {

                    return new AiResponse(
                            sessionId,
                            "Invalid Order ID. Please enter a valid numeric Order ID."
                    );

                } catch (RuntimeException e) {

                    return new AiResponse(
                            sessionId,
                            e.getMessage()
                    );
                }

            // =====================================
            // DEFAULT
            // =====================================

            default:

                return new AiResponse(
                        sessionId,
                        "Please type 'I want to book milk' to start."
                );
        }
    }

    // =========================================
    // DISPLAY AVAILABLE PRODUCTS
    // =========================================

    private String getAvailableProducts() {

        StringBuilder result = new StringBuilder();

        List<Product> products = productRepository.findAll()
                .stream()
                .filter(Product::isAvailable)
                .toList();

        for (int i = 0; i < products.size(); i++) {

            Product product = products.get(i);

            result.append("\n")
                    .append(i + 1)
                    .append(". ")
                    .append(product.getName())
                    .append(" - Rs.")
                    .append(product.getPrice())
                    .append("/")
                    .append(product.getUnit());
        }

        return result.length() == 0
                ? "Currently no products are available."
                : result.toString();
    }

    // =========================================
    // SELECT PRODUCT
    // =========================================

    private AiResponse selectProduct(
            String sessionId,
            ChatSession session,
            String input) {

        List<Product> products = productRepository.findAll()
                .stream()
                .filter(Product::isAvailable)
                .toList();

        Product selected = null;

        // Customer can select using 1, 2, etc.
        if (input.matches("\\d+")) {

            try {

                int index = Integer.parseInt(input) - 1;

                if (index >= 0 && index < products.size()) {
                    selected = products.get(index);
                }

            } catch (NumberFormatException e) {
                // Invalid selection
            }
        }

        // Match product name
        if (selected == null) {

            String normalizedInput = input.toLowerCase()
                    .replaceAll("[^a-z0-9 ]", " ")
                    .trim();

            for (Product product : products) {

                String normalizedName =
                        product.getName().toLowerCase()
                                .replaceAll("[^a-z0-9 ]", " ")
                                .trim();

                String[] words = normalizedInput.split("\\s+");

                boolean matches = true;

                for (String word : words) {

                    if (word.isBlank()) {
                        continue;
                    }

                    if (!normalizedName.contains(word)) {
                        matches = false;
                        break;
                    }
                }

                if (matches) {
                    selected = product;
                    break;
                }
            }
        }

        if (selected == null) {

            return new AiResponse(
                    sessionId,
                    "Please select a valid available product:\n"
                    + getAvailableProducts()
            );
        }

        session.getBooking().setProductId(selected.getId());

        session.setStep("QUANTITY");

        return new AiResponse(
                sessionId,
                "Great! You selected "
                + selected.getName()
                + ". Price: Rs."
                + selected.getPrice()
                + " per "
                + selected.getUnit()
                + ".\n\nHow much Qty you want?"
        );
    }

    // =========================================
    // SELECT QUANTITY
    // =========================================

    private AiResponse selectQuantity(
            String sessionId,
            ChatSession session,
            String input) {

        try {

            // Accept inputs such as "2", "2 litres", "2 litre"
            String value = input.trim().toLowerCase();

            if (!value.matches("\\d+\\s*(litres?|l)?")) {

                return new AiResponse(
                        sessionId,
                        "Please enter a valid whole number of litres. Example: 2 litres."
                );
            }

            int quantity = Integer.parseInt(
                    value.replaceAll("[^0-9]", "")
            );

            if (quantity < 1 || quantity > 100) {

                return new AiResponse(
                        sessionId,
                        "Please enter a quantity between 1 and 100."
                );
            }

            // Save quantity
            session.getBooking().setQuantity(quantity);

            // Find selected product
            Product product = productRepository.findById(
                    session.getBooking().getProductId()
            ).orElse(null);

            if (product == null || !product.isAvailable()) {

                return new AiResponse(
                        sessionId,
                        "Sorry, this product is currently unavailable. "
                        + "Please select another product."
                );
            }

            // Calculate total
            double total = product.getPrice() * quantity;

            // Move to DELIVERY step
            session.setStep("DELIVERY");

            return new AiResponse(
                    sessionId,
                    "Great! 😊\n\n"
                    + "Product: " + product.getName() + "\n"
                    + "Quantity: " + quantity + " " + product.getUnit() + "\n"
                    + "Price: Rs. " + product.getPrice() + "\n"
                    + "Total Amount: Rs. " + total + "\n\n"
                    + "Would you prefer Home Delivery or Customer Pickup?"
            );

        } catch (Exception e) {

            e.printStackTrace();

            return new AiResponse(
                    sessionId,
                    "Sorry, something went wrong. Please enter the quantity again."
            );
        }
    }

    // =========================================
    // SELECT DELIVERY
    // =========================================

    private AiResponse selectDelivery(
            String sessionId,
            ChatSession session,
            String input) {

        if (input.contains("home") || input.contains("delivery")) {

            session.getBooking().setDeliveryType("Home Delivery");

            session.setStep("ADDRESS");

            return new AiResponse(
                    sessionId,
                    "Please provide your delivery address."
            );
        }

        if (input.contains("pickup")) {

            session.getBooking().setDeliveryType("Customer Pickup");

            session.setStep("PHONE");

            return new AiResponse(
                    sessionId,
                    "Please provide your mobile number for the order."
            );
        }

        return new AiResponse(
                sessionId,
                "Please choose Home Delivery or Customer Pickup."
        );
    }

    // =========================================
    // DISPLAY FINAL ORDER SUMMARY
    // =========================================

    private AiResponse showSummary(
            String sessionId,
            ChatSession session) {

        BookingRequest request = session.getBooking();

        Product product = productRepository.findById(
                request.getProductId()
        ).orElseThrow();

        BigDecimal total = BigDecimal.valueOf(product.getPrice())
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        // Set confirmation step
        session.setStep("CONFIRMATION");

        return new AiResponse(
                sessionId,
                "Order Summary 🥛\n\n"
                + "Product: " + product.getName() + "\n"
                + "Quantity: " + request.getQuantity()
                + " " + product.getUnit() + "\n"
                + "Total Amount: Rs." + total + "\n"
                + "Delivery: " + request.getDeliveryType() + "\n"
                + "Customer: " + request.getName() + "\n"
                + "Phone: " + request.getPhone() + "\n"
                + (request.getAddress() != null
                        && !request.getAddress().isBlank()
                        ? "Address: " + request.getAddress() + "\n"
                        : "")
                + "\nShall I confirm your order? Reply Yes or No."
        );
    }
}
