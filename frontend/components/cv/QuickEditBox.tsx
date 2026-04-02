'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

interface QuickEditBoxProps {
  cvRecordId: string | null;
  onRefine: (updatedFinalCV: any) => void;
}

export default function QuickEditBox({ cvRecordId, onRefine }: QuickEditBoxProps) {
  const [text, setText] = useState('');
  const [refining, setRefining] = useState(false);

  const handleRefine = async () => {
    if (!text.trim() || !cvRecordId) return;
    setRefining(true);
    try {
      const res = await refineCV(cvRecordId, text.trim());
      onRefine(res.data.final_cv);
      toast.success('CV updated');
      setText('');
    } catch {
      toast.error('Failed to apply changes');
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-medium text-muted-foreground">Quick Edit</span>
      </div>
      <Textarea
        placeholder="Tell AI what to change..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        rows={1}
        className="resize-none text-xs overflow-hidden min-h-0"
        disabled={refining}
      />
      <Button
        onClick={handleRefine}
        disabled={refining || !text.trim() || !cvRecordId}
        size="sm"
        className="w-full"
      >
        {refining ? 'Applying...' : 'Apply'}
      </Button>
    </div>
  );
}
