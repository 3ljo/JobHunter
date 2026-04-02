'use client';

import CVHistory from '@/components/cv/CVHistory';
import { History, Clock } from 'lucide-react';

export default function CVHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <History className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CV History</h1>
            <p className="text-zinc-500 text-xs">View your past CV analyses and scores</p>
          </div>
        </div>
      </div>
      <CVHistory />
    </div>
  );
}
