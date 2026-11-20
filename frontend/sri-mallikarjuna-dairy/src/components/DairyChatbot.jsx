import React, { useState, useRef, useEffect } from "react";
import "./DairyChatbot.css";

function DairyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! Welcome to Sri Mallikarjuna Dairy. How can I help you today?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8085/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("AI server error: " + response.status);
      }

      const data = await response.json();

      // Store session ID returned by Spring Boot
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Sorry! Our AI assistant is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dairy-chatbot">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h3>🥛 Dairy AI Assistant</h3>
              <span>Ask us anything!</span>
            </div>

            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <strong>
                  {msg.role === "user" ? "You" : "Dairy Assistant"}
                </strong>

                <p>{msg.content}</p>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai">
                <strong>Dairy Assistant</strong>
                <p>Thinking...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask about milk..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              disabled={loading}
            />

            <button onClick={sendMessage} disabled={loading || !message.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "×" : "💬"}
      </button>

      <span className="chatbot-label">AI Assistance</span>
    </div>
  );
}

export default DairyChatbot;
