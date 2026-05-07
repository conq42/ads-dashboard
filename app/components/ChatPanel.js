'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CHIPS = [
  'Which campaign has the worst ROAS?',
  'Where is budget being wasted?',
  'Compare Meta vs Google performance',
  'Top converting keywords this month',
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setMessages([...updated, {
        role: 'assistant',
        content: data.error ? `⚠️ ${data.error}` : data.content,
      }]);
    } catch {
      setMessages([...updated, {
        role: 'assistant',
        content: '⚠️ Connection error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <aside className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          <span className="chat-panel-title-icon">◈</span>
          AI Assistant
        </div>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={() => setMessages([])}>Clear</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">◈</div>
            <p>Ask anything about your campaigns or ad data.</p>
            <div className="chat-chips">
              {CHIPS.map((c, i) => (
                <button key={i} className="chat-chip" onClick={() => send(c)}>{c}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'user' ? (
                  <div className="msg-bubble">{msg.content}</div>
                ) : (
                  <>
                    <div className="msg-role">AdsAI</div>
                    <div className="msg-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="msg-role">AdsAI</div>
                <div className="msg-content">
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about campaigns..."
            rows={1}
            className="chat-textarea"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="chat-send"
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}
