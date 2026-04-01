'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';

interface QuickEditBoxProps {
  cvRecordId: string;
  onRefine: (updatedFinalCV: any) => void;
}

export default function QuickEditBox({ cvRecordId, onRefine }: QuickEditBoxProps) {
  const [text, setText] = useState('');
  const [refining, setRefining] = useState(false);

  const handleRefine = async () => {
    if (!text.trim()) return;
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
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h4 className="text-sm font-medium text-foreground">Quick Edit with AI</h4>
      <Textarea
        placeholder='e.g. "Change summary to 5 years experience", "Add Kubernetes to skills", "Remove the second job"...'
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="resize-none"
        disabled={refining}
      />
      <Button
        onClick={handleRefine}
        disabled={refining || !text.trim()}
        className="w-full"
      >
        {refining ? 'Applying...' : 'Apply Changes'}
      </Button>
    </div>
  );
}
