'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchJobsWithAI } from '@/lib/api';
import { ChatMessage } from '@/types';
import JobCard from './JobCard';
import toast from 'react-hot-toast';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you find jobs. Tell me what kind of role you\'re looking for, your preferred location, or any other preferences.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await searchJobsWithAI(text, history);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.ai_message,
        jobs: res.data.jobs,
        search_performed: res.data.search_performed,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to search');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
            {msg.search_performed && msg.jobs && msg.jobs.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {msg.jobs.map((job, j) => (
                  <JobCard key={j} job={job} />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="e.g. Find remote React developer roles in Europe..."
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
