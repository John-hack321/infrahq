'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// CONFIGURATION — your n8n webhook URL
// ============================================================
const WEBHOOK_URL = '/api/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-emerald-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <span className="text-[9px] font-black text-white">IR</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-black text-white rounded-tr-sm'
            : 'bg-emerald-50 text-gray-800 border border-emerald-100 rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

export default function InfraredChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm the Infrared assistant. Ask me anything about what we're building, how to partner with us, or our mission. 👋",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
  console.log('[chat widget] Sending message:', text);
  
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text }),
  });

  console.log('[chat widget] Response status:', res.status);
  const raw = await res.text();
  console.log('[chat widget] Raw response:', raw);

  const data = JSON.parse(raw);
  const reply = typeof data === 'string'
    ? data
    : data.reply || data.message || 'Sorry, I could not get a response.';

  console.log('[chat widget] Final reply:', reply);

  setMessages((prev) => [
    ...prev,
    {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
    },
  ]);
} catch (err) {
  console.error('[chat widget] ERROR:', err);
  setMessages((prev) => [
    ...prev,
    {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Sorry, I am having trouble connecting right now. Please try again shortly.',
    },
  ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = ['What is Infrared?', 'How to partner?', "What are you building?"];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[340px] sm:w-[360px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              height: '500px',
              background: '#ffffff',
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(16,185,129,0.08)',
            }}
          >
            {/* Header */}
            <div
              style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' }}
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <span className="text-[10px] font-black text-white tracking-tight">IR</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none tracking-tight">
                    Infrared Assistant
                  </p>
                  <p className="text-emerald-400 text-[11px] mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="text-[9px] font-black text-white">IR</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about Infrared..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: input.trim() && !isLoading ? '#000000' : '#e5e7eb',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    style={{ color: input.trim() && !isLoading ? '#ffffff' : '#9ca3af' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5 tracking-wide">
                Powered by Infrared AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button — matches site aesthetic */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all"
        style={{
          background: isOpen ? '#000000' : '#ffffff',
          border: '1.5px solid',
          borderColor: isOpen ? '#000000' : 'rgba(16,185,129,0.4)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <span className="text-[8px] font-black text-white">IR</span>
        </div>
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.span
              key="open"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xs font-semibold text-gray-800 whitespace-nowrap overflow-hidden"
            >
              Ask Infrared AI
            </motion.span>
          ) : (
            <motion.span
              key="close"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xs font-semibold text-white whitespace-nowrap overflow-hidden"
            >
              Close
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread dot */}
        <AnimatePresence>
          {hasUnread && !isOpen && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}