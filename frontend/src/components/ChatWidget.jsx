import { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

// Aciliyet adımında ziyaretçiye net seçenekler sunuyoruz (PRD kararımız:
// aciliyeti serbest metinden çıkarmak yerine sabit seçeneklerle sormak).
const URGENCY_OPTIONS = [
  { label: 'Hemen konuşmak istiyorum', value: 'Hemen konuşmak istiyorum' },
  { label: 'Bu hafta içinde', value: 'Bu hafta içinde' },
  { label: 'Sadece bilgi alıyorum', value: 'Sadece bilgi alıyorum' },
];

function getSessionId() {
  let id = sessionStorage.getItem('nr_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('nr_session_id', id);
  }
  return id;
}

export default function ChatWidget({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState('greeting');
  const [isComplete, setIsComplete] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // botlar için tuzak alan, insanlar görmüyor
  const sessionId = useRef(getSessionId());
  const bottomRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch('/api/chat/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.current }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMessages([{ role: 'assistant', content: data.reply }]);
        setStage(data.stage);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || thinking || isComplete) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, message: trimmed, honeypot }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setStage(data.stage);
      setIsComplete(data.isComplete);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Bağlantıda bir sorun oldu, lütfen tekrar deneyin.' },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chat-widget" role="dialog" aria-label="Tunç Bilişim sohbet">
      <div className="chat-header">
        <div>
          <div className="chat-header-title">Tunç Bilişim</div>
          <div className="chat-header-subtitle">Genelde birkaç dakikada yanıtlıyoruz</div>
        </div>
        <button className="chat-close" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble-row ${m.role}`}>
            <div className={`chat-bubble ${m.role}`}>{m.content}</div>
          </div>
        ))}

        {thinking && (
          <div className="chat-bubble-row assistant">
            <div className="chat-bubble assistant thinking">
              <span className="pulse-bar" />
              <span className="pulse-bar" />
              <span className="pulse-bar" />
            </div>
          </div>
        )}

        {stage === 'urgency' && !thinking && !isComplete && (
          <div className="chat-quick-replies">
            {URGENCY_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => sendMessage(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        {/* Honeypot: gerçek kullanıcılar bunu görmez, botlar genelde doldurur. */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="chat-honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isComplete ? 'Görüşme tamamlandı' : 'Mesajınızı yazın...'}
          disabled={isComplete || thinking}
        />
        <button type="submit" disabled={isComplete || thinking || !input.trim()}>
          Gönder
        </button>
      </form>
    </div>
  );
}
