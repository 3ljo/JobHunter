'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { sendChatBotMessage, type ChatBotMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type UIMessage = ChatBotMessage & { id: string };

const BRAND = 'CVClimber';

const QUICK_REPLIES = [
  'How does CV scoring work?',
  'What plans do you offer?',
  'How do I cancel my subscription?',
];

const newId = () => Math.random().toString(36).slice(2, 10);

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: newId(),
          role: 'assistant',
          content: `Hi, I'm the ${BRAND} assistant. How can I help you today?`,
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    const userMsg: UIMessage = { id: newId(), role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const history: ChatBotMessage[] = nextMessages
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const { data } = await sendChatBotMessage(text, history);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', content: data.reply },
      ]);
    } catch (err: any) {
      const fallback =
        err?.response?.data?.error ||
        "Sorry, I can't reach the assistant right now. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', content: fallback },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full',
          'bg-[#1a2466] text-white shadow-lg ring-1 ring-black/10',
          'transition-colors hover:bg-[#222e80]'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        role="dialog"
        aria-label={`${BRAND} chat assistant`}
        className={cn(
          'fixed z-[60] flex flex-col overflow-hidden rounded-xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/10',
          'transition-all duration-150 ease-out',
          'bottom-24 right-5 w-[calc(100vw-2.5rem)] max-w-[380px] h-[70vh] max-h-[600px]',
          'sm:w-[380px]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 bg-[#1a2466] px-4 py-3 text-white">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{BRAND} Assistant</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Online</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}

            {sending && (
              <div className="flex">
                <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-neutral-200">
                  <TypingDots />
                </div>
              </div>
            )}

            {messages.length <= 1 && !sending && (
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Suggested questions
                </p>
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:border-[#1a2466] hover:text-[#1a2466]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-neutral-200 bg-white px-3 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            maxLength={2000}
            disabled={sending}
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#1a2466] focus:outline-none focus:ring-1 focus:ring-[#1a2466]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={sending || !input.trim()}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
              input.trim() && !sending
                ? 'bg-[#1a2466] text-white hover:bg-[#222e80]'
                : 'bg-neutral-200 text-neutral-400'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}

function MessageRow({ message }: { message: UIMessage }) {
  if (message.role === 'assistant') {
    return (
      <div className="flex">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm leading-relaxed text-neutral-800 ring-1 ring-neutral-200">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-[#1a2466] px-3 py-2 text-sm leading-relaxed text-white">
        {message.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
    </div>
  );
}
