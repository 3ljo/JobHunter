'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CVHistory from '@/components/cv/CVHistory';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { History } from 'lucide-react';

export default function CVHistoryPage() {
  const { t } = useTranslation();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  useEffect(() => { if (!subscription) fetchSubscription(); }, [subscription, fetchSubscription]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
            <History className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight">{t('cvHistory.title')}</h1>
            <p className="text-muted-foreground/60 text-xs">{t('cvHistory.subtitle')}</p>
          </div>
        </div>
      </div>
      <CVHistory />
    </div>
  );
}
