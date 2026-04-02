'use client';

import CVHistory from '@/components/cv/CVHistory';
import { History } from 'lucide-react';

export default function CVHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <History className="h-5 w-5 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">CV History</h1>
        </div>
        <p className="text-zinc-400 text-sm">View your past CV analyses and scores.</p>
      </div>
      <CVHistory />
    </div>
  );
}
