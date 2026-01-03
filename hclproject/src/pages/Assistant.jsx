import React, { useMemo, useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { from: "ai", type: "text", text: "Upload PDFs/images or paste text. I'll simplify it based on your learning style." },
  ]);

  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fileLabel = useMemo(() => {
    if (!files.length) return "No files selected";
    return `${files.length} file(s): ${files.map((f) => f.name).join(", ")}`;
  }, [files]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function send() {
    if (!input.trim() && files.length === 0) return;

    setError("");
    setBusy(true);

    const userText = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        type: "text",
        text: userText || "(Uploaded files)",
        files: files.map(f => f.name),
      },
    ]);

    try {
      const fd = new FormData();
      fd.append("message", userText);
      files.forEach((f) => fd.append("files", f));

      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Assistant request failed");

      setMessages((prev) => [
        ...prev,
        {
          from: "ai",
          type: "structured",
          payload: data,
        },
      ]);

      setInput("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e.message || "Failed to get response");
    } finally {
      setBusy(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 200px)',
      maxHeight: '800px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))',
        border: '1px solid rgba(100,108,255,0.15)',
        padding: '1.5rem',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(100,108,255,0.3)'
          }}>AI</div>
          <div>
            <h3 style={{ 
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '1.5rem'
            }}>AI Learning Assistant</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Upload PDFs/images or paste text for personalized learning
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '0.75rem 1rem',
          margin: '0 0 1rem 0',
          borderRadius: '8px'
        }}>
          <div style={{ 
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              flexShrink: 0
            }}>!</div>
            {error}
          </div>
        </div>
      )}

      {/* Chat Window */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.05)',
        borderTop: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '1rem 1.25rem',
              borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.from === 'user' 
                ? 'linear-gradient(135deg, rgba(100,108,255,0.2), rgba(97,218,251,0.15))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: `1px solid ${m.from === 'user' ? 'rgba(100,108,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {/* User Label */}
              {m.from === 'user' && (
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#61dafb',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>You</div>
              )}

              {/* AI Label */}
              {m.from === 'ai' && (
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#646cff',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>AI Assistant</div>
              )}

              {/* Text Message */}
              {m.type === "text" && (
                <div>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: '1.6' }}>{m.text}</p>
                  {m.files && m.files.length > 0 && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        Attached files:
                      </div>
                      {m.files.map((fileName, i) => (
                        <div key={i} style={{
                          fontSize: '0.85rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          marginBottom: '0.25rem',
                          display: 'inline-block',
                          marginRight: '0.5rem'
                        }}>
                          {fileName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Structured Response */}
              {m.type === "structured" && (
                <div>
                  {/* Simplified Explanation */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: "0 0 0.75rem 0",
                      color: '#61dafb',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#61dafb',
                        boxShadow: '0 0 8px rgba(97,218,251,0.6)'
                      }}></div>
                      Simplified Explanation
                    </h4>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: '1.7', color: 'rgba(255,255,255,0.9)' }}>
                      {m.payload?.simplifiedExplanation}
                    </p>
                  </div>

                  {/* Key Points */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: "0 0 0.75rem 0",
                      color: '#61dafb',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#61dafb',
                        boxShadow: '0 0 8px rgba(97,218,251,0.6)'
                      }}></div>
                      Key Points
                    </h4>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {(m.payload?.keyPoints || []).map((k, i) => (
                        <li key={i} style={{ 
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.9)'
                        }}>{k}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Study Plan */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: "0 0 0.75rem 0",
                      color: '#61dafb',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#61dafb',
                        boxShadow: '0 0 8px rgba(97,218,251,0.6)'
                      }}></div>
                      Study Plan
                    </h4>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {(m.payload?.studyPlan || []).map((s, i) => (
                        <li key={i} style={{ 
                          lineHeight: '1.6',
                          color: 'rgba(255,255,255,0.9)'
                        }}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Practice Section */}
                  <div>
                    <h4 style={{ 
                      margin: "0 0 0.75rem 0",
                      color: '#61dafb',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#61dafb',
                        boxShadow: '0 0 8px rgba(97,218,251,0.6)'
                      }}></div>
                      Practice
                    </h4>

                    {/* Flashcards */}
                    {(m.payload?.practice?.flashcards || []).length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Flashcards</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(m.payload?.practice?.flashcards || []).map((c, i) => (
                            <div key={i} style={{
                              padding: '0.75rem',
                              background: 'rgba(100,108,255,0.1)',
                              border: '1px solid rgba(100,108,255,0.2)',
                              borderRadius: '8px'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#61dafb' }}>
                                {c.front}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                                {c.back}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Q&A */}
                    {(m.payload?.practice?.questions || []).length > 0 && (
                      <div>
                        <div style={{ 
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>Questions & Answers</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(m.payload?.practice?.questions || []).map((q, i) => (
                            <div key={i} style={{
                              padding: '0.75rem',
                              background: 'rgba(97,218,251,0.1)',
                              border: '1px solid rgba(97,218,251,0.2)',
                              borderRadius: '8px'
                            }}>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: '#61dafb' }}>Q: </span>
                                <span style={{ color: 'rgba(255,255,255,0.9)' }}>{q.q}</span>
                              </div>
                              <div>
                                <span style={{ fontWeight: '600', color: '#4ade80' }}>A: </span>
                                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{q.a}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        {/* File Chips */}
        {files.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap',
            marginBottom: '0.75rem'
          }}>
            {files.map((file, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(100,108,255,0.15)',
                border: '1px solid rgba(100,108,255,0.3)',
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                <span>{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    padding: '0',
                    fontSize: '1rem',
                    lineHeight: '1',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask what you want to learn… (Press Enter to send, Shift+Enter for new line)"
          rows={3}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "inherit",
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '0.75rem',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(100,108,255,0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="application/pdf,image/*" 
            multiple 
            onChange={onPickFiles}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: '500',
              fontSize: '0.95rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.08)';
              e.target.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.05)';
              e.target.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            Attach Files
          </label>

          <button 
            onClick={send} 
            disabled={busy || (!input.trim() && files.length === 0)}
            style={{
              marginLeft: 'auto',
              padding: '0.75rem 2rem',
              background: (busy || (!input.trim() && files.length === 0))
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: (busy || (!input.trim() && files.length === 0)) ? 'not-allowed' : 'pointer',
              opacity: (busy || (!input.trim() && files.length === 0)) ? 0.5 : 1,
              transition: 'all 0.3s ease',
              boxShadow: (busy || (!input.trim() && files.length === 0))
                ? 'none'
                : '0 4px 12px rgba(100,108,255,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!busy && (input.trim() || files.length > 0)) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(100,108,255,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!busy && (input.trim() || files.length > 0)) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(100,108,255,0.3)';
              }
            }}
          >
            {busy ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}