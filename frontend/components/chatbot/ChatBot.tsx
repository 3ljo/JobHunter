'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MoreVertical, Paperclip, Send, Sparkles, Trash2 } from 'lucide-react';
import { sendChatBotMessage, type ChatBotMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type UIMessage = ChatBotMessage & { id: string; ts: Date };

const BRAND = 'CVClimber';
const ROBOT_IDLE = '/aivent/misc/robot-idle.png';
const ROBOT_HERO = '/aivent/misc/landingrobot.png';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [startedAt, setStartedAt] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close the kebab menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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

  const clearConversation = () => {
    setMessages([]);
    setStartedAt(new Date());
    setMenuOpen(false);
  };

  return (
    <>
      {/* Floating launcher — circular button bottom-right with the robot peeking out */}
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-5 right-5 z-[60] flex h-16 w-16 items-center justify-center overflow-hidden rounded-full',
          'bg-gradient-to-br from-[#1a2466] via-[#2333a0] to-[#5a7cff]',
          'shadow-[0_12px_32px_rgba(26,36,102,0.6)]',
          'transition-transform hover:scale-105 active:scale-95',
          'ring-2 ring-white/15'
        )}
      >
        {open ? (
          <ChevronDown className="h-7 w-7 text-white" strokeWidth={2.4} />
        ) : (
          <>
            {/* Soft inner glow */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.35),transparent_60%)]" />
            {/* Robot peeks out — positioned so the head/torso are visible */}
            <img
              src={ROBOT_IDLE}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-1/2 h-[110%] w-auto -translate-x-1/2 select-none"
              draggable={false}
            />
            {/* Online dot */}
            <span className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#1a2466]" />
          </>
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
        <div className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-[#1a2466] via-[#222e80] to-[#3346b6] px-4 py-3 text-white">
          {/* Decorative gradient orbs */}
          <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <span className="pointer-events-none absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-cyan-400/15 blur-2xl" />

          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="relative z-10 rounded-full p-1 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#0d1130] ring-1 ring-white/15">
            <img src={ROBOT_IDLE} alt="" aria-hidden className="h-[125%] w-auto -mb-1 select-none" draggable={false} />
          </div>
          <div className="relative z-10 min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{BRAND} Assistant</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="truncate">{startedLabel}</span>
            </div>
          </div>

          {/* Kebab menu — custom dropdown (no native confirm()) */}
          <div ref={menuRef} className="relative z-10">
            <button
              type="button"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl bg-white text-neutral-800 shadow-2xl ring-1 ring-black/10"
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={clearConversation}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-neutral-50"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  Clear conversation
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-t border-neutral-100 px-3 py-2.5 text-left text-sm font-medium hover:bg-neutral-50"
                >
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                  Minimize chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#f7f8ff] px-4 py-4"
        >
          {/* Faint robot watermark — only visible in the empty/early state */}
          {messages.length <= 1 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-2 flex justify-center opacity-[0.07]"
            >
              <img src={ROBOT_HERO} alt="" className="h-48 w-auto" draggable={false} />
            </div>
          )}

          <p className="relative mb-3 text-center text-[11px] text-neutral-500">
            This chat is powered by AI. Don&apos;t share passwords or payment details.
          </p>
          <p className="relative mb-4 text-center text-[11px] font-medium text-neutral-500">
            {formatTime(startedAt)}
          </p>

          {/* Welcome card — only visible before the user sends a first message */}
          {messages.length <= 1 && (
            <div className="relative mb-4 flex flex-col items-center rounded-2xl bg-white/80 px-4 py-4 text-center shadow-sm ring-1 ring-black/5 backdrop-blur">
              <img src={ROBOT_HERO} alt="CVClimber robot" className="mb-2 h-24 w-auto drop-shadow-md" draggable={false} />
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1a2466]">
                <Sparkles className="h-3.5 w-3.5" />
                {BRAND} Assistant
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-700">
                Hi! I can help with CVs, cover letters, plans, and your account.
              </p>
            </div>
          )}

          <div className="relative flex flex-col gap-3">
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
                    className="rounded-full border border-[#1a2466]/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#1a2466] backdrop-blur transition-colors hover:bg-[#1a2466]/5"
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
    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0d1130] ring-1 ring-[#1a2466]/40">
      <img src={ROBOT_IDLE} alt="" aria-hidden className="h-[130%] w-auto -mb-1 select-none" draggable={false} />
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
      <div className="max-w-[78%] whitespace-pre-wrap rounded-full border border-[#1a2466]/60 bg-white px-4 py-2 text-sm text-[#1a2466] shadow-sm">
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
