'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MessageCircle, MoreVertical, Paperclip, Send } from 'lucide-react';
import { sendChatBotMessage, type ChatBotMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type UIMessage = ChatBotMessage & { id: string; ts: Date };

const BRAND = 'CVClimber';
const QUICK_REPLIES = [
  'How does CV scoring work?',
  'What plans do you offer?',
  'Generate a cover letter',
  'My payment didn\'t apply',
];

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const newId = () => Math.random().toString(36).slice(2, 10);

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [startedAt] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Greet on first open so the panel isn't empty.
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: newId(),
          role: 'assistant',
          content: 'Hi there! I\'m the CVClimber assistant. Ask me anything about CVs, cover letters, plans, or your account.',
          ts: new Date(),
        },
      ]);
    }
  }, [open, messages.length]);

  // Auto-scroll to bottom on new message.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, open]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const startedLabel = useMemo(() => {
    const d = startedAt;
    const month = d.toLocaleString([], { month: 'short' });
    const day = d.getDate();
    return `Started ${month} ${day} at ${formatTime(d)}`;
  }, [startedAt]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    const userMsg: UIMessage = { id: newId(), role: 'user', content: text, ts: new Date() };
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
        { id: newId(), role: 'assistant', content: data.reply, ts: new Date() },
      ]);
    } catch (err: any) {
      const fallback =
        err?.response?.data?.error ||
        'Sorry, I can\'t reach the assistant right now. Please try again in a moment.';
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', content: fallback, ts: new Date() },
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
      {/* Floating launcher — circular button bottom-right */}
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full',
          'bg-[#1a2466] text-white shadow-[0_10px_30px_rgba(26,36,102,0.55)]',
          'transition-transform hover:scale-105 active:scale-95',
          'ring-1 ring-white/10'
        )}
      >
        {open ? (
          <ChevronDown className="h-6 w-6" strokeWidth={2.4} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
        )}
      </button>

      {/* Chat panel */}
      <div
        role="dialog"
        aria-label="CVClimber chat assistant"
        className={cn(
          'fixed z-[60] flex flex-col overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl',
          'ring-1 ring-black/10',
          'transition-all duration-200 ease-out',
          'bottom-24 right-5 w-[calc(100vw-2.5rem)] max-w-[400px] h-[75vh] max-h-[640px]',
          'sm:w-[400px]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#1a2466] px-4 py-3 text-white">
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1130] text-sm font-bold ring-1 ring-white/15">
            CV
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{startedLabel}</div>
          </div>
          <button
            type="button"
            aria-label="More options"
            className="rounded-full p-1 hover:bg-white/10"
            onClick={() => {
              if (confirm('Clear this conversation?')) {
                setMessages([]);
              }
            }}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white px-4 py-4">
          <p className="mb-3 text-center text-[11px] text-neutral-500">
            This chat is powered by AI. Don&apos;t share passwords or payment details.
          </p>
          <p className="mb-4 text-center text-[11px] font-medium text-neutral-500">
            {formatTime(startedAt)}
          </p>

          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}

            {sending && (
              <div className="flex items-end gap-2">
                <Avatar />
                <div className="rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2">
                  <TypingDots />
                </div>
              </div>
            )}

            {messages.length <= 1 && !sending && (
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-full border border-[#1a2466]/60 px-3 py-1.5 text-xs font-medium text-[#1a2466] transition-colors hover:bg-[#1a2466]/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-neutral-200 bg-white px-3 py-3"
        >
          <button
            type="button"
            aria-label="Attach (coming soon)"
            disabled
            className="rounded-full p-2 text-neutral-400"
            title="Attachments aren't supported yet"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center rounded-full border border-neutral-300 bg-white px-4 py-2 focus-within:border-[#1a2466]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              maxLength={2000}
              disabled={sending}
              className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            aria-label="Send"
            disabled={sending || !input.trim()}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
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

function Avatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1a2466] text-[10px] font-bold text-white">
      CV
    </div>
  );
}

function MessageRow({ message }: { message: UIMessage }) {
  if (message.role === 'assistant') {
    return (
      <div className="flex flex-col">
        <span className="ml-9 text-[11px] font-semibold text-rose-600">{BRAND}</span>
        <div className="mt-1 flex items-end gap-2">
          <Avatar />
          <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm leading-relaxed text-neutral-800">
            {message.content}
          </div>
        </div>
        <span className="mt-1 ml-9 text-[10px] text-neutral-400">Just now</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[78%] whitespace-pre-wrap rounded-full border border-[#1a2466]/60 px-4 py-2 text-sm text-[#1a2466]">
        {message.content}
      </div>
      <span className="mt-1 mr-2 text-[10px] text-neutral-400">{formatTime(message.ts)}</span>
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
