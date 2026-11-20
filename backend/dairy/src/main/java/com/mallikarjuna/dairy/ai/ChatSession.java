package com.mallikarjuna.dairy.ai;

import com.mallikarjuna.dairy.dto.BookingRequest;

public class ChatSession {

    private String step = "START";

    private final BookingRequest booking =
            new BookingRequest();

    public String getStep() {
        return step;
    }

    public void setStep(String step) {
        this.step = step;
    }

    public BookingRequest getBooking() {
        return booking;
    }
}