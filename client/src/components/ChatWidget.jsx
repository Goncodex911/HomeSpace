import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { resolveImageUrl } from '../api/api';
import { formatUSD } from '../utils/currency';

const STARTER_MESSAGE = {
  role: 'assistant',
  content:
    'Hi, I am Lumina Assistant. Tell me your room, style, or budget and I will suggest furniture from our current catalog.',
};

const HIDDEN_PATH_PREFIXES = ['/admin', '/store', '/login', '/register', '/verify-otp', '/reset-password'];

const ChatWidget = () => {
  const { pathname } = useLocation();
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const hidden = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestions, open, loading]);

  if (hidden) return null;

  const resetSession = () => {
    if (loading) return;
    setMessages([STARTER_MESSAGE]);
    setSuggestions([]);
    setInput('');
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const history = nextMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));
      const res = await api('/chat', {
        method: 'POST',
        body: { message: text, history },
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setSuggestions(res.suggestedProducts || []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'Sorry, I could not respond right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(100vw-2rem,380px)] h-[min(72vh,560px)] bg-white border border-outline-variant/40 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/30 bg-surface-container-low flex items-center justify-between">
            <div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Lumina Assistant</p>
              <h3 className="font-headline-md text-sm text-primary font-bold">Shopping Chat</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetSession}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2 py-1 border border-outline-variant/40 text-[10px] font-label-caps uppercase tracking-wider text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
                aria-label="Start new chat session"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                New Session
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Close chat"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-background">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border border-outline-variant/30 text-primary'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 text-sm bg-white border border-outline-variant/30 text-on-surface-variant">
                  Thinking...
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Suggested products
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {suggestions.map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 p-3 bg-white border border-outline-variant/30 hover:border-primary transition-colors"
                    >
                      <div className="w-16 h-16 bg-surface-container-low overflow-hidden shrink-0">
                        {product.image ? (
                          <img
                            src={resolveImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined">chair</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{product.name}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{product.category}</p>
                        <p className="text-sm text-secondary mt-1">{formatUSD(product.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t border-outline-variant/30 p-4 bg-white">
            {user?.fullName && (
              <p className="text-[10px] text-on-surface-variant mb-2 truncate">Signed in as {user.fullName}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sofas, lamps, budget..."
                className="flex-1 border border-outline-variant/40 px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-primary text-white disabled:opacity-50 hover:bg-secondary transition-colors"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`chat-fab shrink-0 bg-primary text-white shadow-lg hover:bg-secondary transition-colors flex items-center justify-center overflow-hidden ${open ? '' : 'chat-fab-bounce'}`}
        aria-label={open ? 'Close Lumina Assistant' : 'Open Lumina Assistant'}
      >
        <span className="material-symbols-outlined text-[26px] leading-none">{open ? 'close' : 'smart_toy'}</span>
      </button>
    </div>
  );
};

export default ChatWidget;
