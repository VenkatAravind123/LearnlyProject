import React, { useState } from "react";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! Ask me anything about your current lesson." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text: input }, { from: "ai", text: "Here's a quick explanation with related topics." }]);
    setInput("");
  };

  return (
    <section className="assistant">
      <div className="section-header">
        <h3>AI Assistant</h3>
        <p className="muted">Contextual RAG-powered help</p>
      </div>

      <div className="chat-window">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.from}`}>
            <p>{m.text}</p>
            {m.from === "ai" && (
              <div className="muted small">Suggested: Components • Props • State</div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
        />
        <button className="btn-primary" onClick={send}>Send</button>
      </div>
    </section>
  );
}