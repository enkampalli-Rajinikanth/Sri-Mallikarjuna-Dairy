package com.mallikarjuna.dairy.ai;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    private final DairyChatService dairyChatService;

    public AiController(DairyChatService dairyChatService) {
        this.dairyChatService = dairyChatService;
    }

    @PostMapping("/chat")
    public AiResponse chat(@RequestBody AiRequest request) {

        return dairyChatService.chat(
                request.sessionId(),
                request.message()
        );
    }
}