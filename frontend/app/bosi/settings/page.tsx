'use client';

import { useEffect, useState } from 'react';
import { getAdminSettings, updateAdminSettings, getAdminOverview } from '@/lib/api';
import { Cpu, Save, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppSettings {
  ai_provider: string;
  ai_model_anthropic: string;
  ai_model_openai: string;
  ai_model_gemini: string;
  max_tokens: number;
  rate_limit_cv_per_day: number;
  rate_limit_cl_per_day: number;
  usdt_wallet_address: string;
  usdt_network: string;
}

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    color: '#34d399',
    description: 'Cheapest. Free tier (1,500 req/day).',
    keyEnv: 'gemini_key',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    color: '#60a5fa',
    description: 'Balanced quality + cost.',
    keyEnv: 'openai_key',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-nano', 'gpt-4-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    color: '#c084fc',
    description: 'Highest quality, most expensive.',
    keyEnv: 'anthropic_key',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  },
];

type HealthMap = Record<string, boolean>;

export default function BosiSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [costTable, setCostTable] = useState<Record<string, { input: number; output: number }>>({});
  const [health, setHealth] = useState<HealthMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([getAdminSettings(), getAdminOverview()])
      .then(([s, o]) => {
        setSettings(s.data.settings);
        setCostTable(s.data.costTable || {});
        setHealth(o.data.health || {});
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (p: Partial<AppSettings>) => {
    setSettings((s) => (s ? { ...s, ...p } : s));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      toast.success('Settings saved');
      setDirty(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  if (!settings) return <p className="text-white/55">Failed to load.</p>;

  const activeProvider = PROVIDERS.find((p) => p.id === settings.ai_provider);
  const activeModelKey = `ai_model_${settings.ai_provider}` as keyof AppSettings;
  const activeModel = settings[activeModelKey] as string;
  const activeRates = costTable[activeModel];

  return (
    <div className="space-y-8 max-w-3xl pb-20">

      {/* AI Provider */}
      <Section title="AI Provider" icon={Cpu}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => {
            const active = settings.ai_provider === p.id;
            const keyOk = !!health[p.keyEnv];
            return (
              <button
                key={p.id}
                onClick={() => patch({ ai_provider: p.id })}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: active ? `${p.color}10` : '#1a1e42',
                  border: active ? `2px solid ${p.color}` : '2px solid rgba(255,255,255,0.10)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-white text-sm font-bold">{p.name}</span>
                  </div>
                  {active && <CheckCircle className="h-4 w-4" style={{ color: p.color }} />}
                </div>
                <p className="text-white/55 text-[11px] mb-2 leading-snug">{p.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                  {keyOk
                    ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                    : <XCircle className="h-3 w-3 text-red-400" />}
                  <span style={{ color: keyOk ? '#34d399' : '#f87171' }}>
                    {keyOk ? 'API key set' : 'KEY MISSING'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Active model — only show the one that matters */}
      <Section title={`Model — ${activeProvider?.name}`}>
        <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <div>
            <p className="text-white/70 text-xs">Pick which model the active provider uses for AI calls.</p>
            {activeRates && (
              <p className="text-white/45 text-[10px] mt-1">
                Input ${activeRates.input}/1M tokens · Output ${activeRates.output}/1M tokens
              </p>
            )}
          </div>
          <select
            value={activeModel}
            onChange={(e) => patch({ [activeModelKey]: e.target.value } as Partial<AppSettings>)}
            className="px-3 py-2 rounded-lg text-sm text-white outline-none cursor-pointer min-w-[220px]"
            style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
          >
            {activeProvider?.models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </Section>

      {/* Limits */}
      <Section title="Limits & Quotas">
        <div className="space-y-2">
          <NumberRow
            label="Max tokens per AI call"
            hint="Caps response length. 4000 is fine for most CV/CL flows."
            value={settings.max_tokens}
            onChange={(n) => patch({ max_tokens: n || 4000 })}
            width="w-28"
          />
          <NumberRow
            label="CV analyses / free user / day"
            hint="Daily quota for free-tier accounts."
            value={settings.rate_limit_cv_per_day}
            onChange={(n) => patch({ rate_limit_cv_per_day: n || 10 })}
          />
          <NumberRow
            label="Cover letters / free user / day"
            hint="Daily quota for free-tier accounts."
            value={settings.rate_limit_cl_per_day}
            onChange={(n) => patch({ rate_limit_cl_per_day: n || 20 })}
          />
        </div>
      </Section>

      {/* USDT — used by /api/subscription/usdt-config */}
      <Section title="USDT Checkout">
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <p className="text-white/70 text-sm font-semibold mb-1">Wallet address</p>
            <p className="text-white/45 text-[11px] mb-2">Shown to customers on the USDT checkout page.</p>
            <input
              type="text"
              value={settings.usdt_wallet_address || ''}
              onChange={(e) => patch({ usdt_wallet_address: e.target.value })}
              placeholder="e.g. TXqZ1r…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white font-mono placeholder:text-white/25 outline-none"
              style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div>
              <p className="text-white/70 text-sm font-semibold">Network / chain</p>
              <p className="text-white/45 text-[11px]">Which chain customers must send USDT on.</p>
            </div>
            <select
              value={settings.usdt_network || 'TRC-20'}
              onChange={(e) => patch({ usdt_network: e.target.value })}
              className="px-3 py-2 rounded-lg text-xs text-white outline-none cursor-pointer"
              style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
            >
              <option value="TRC-20">TRC-20 (Tron)</option>
              <option value="ERC-20">ERC-20 (Ethereum)</option>
              <option value="BEP-20">BEP-20 (BSC)</option>
              <option value="SOL">Solana</option>
              <option value="MATIC">Polygon</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Sticky save */}
      <div
        className="sticky bottom-4 mt-8 flex items-center justify-between rounded-xl px-5 py-3"
        style={{
          background: 'rgba(15,18,37,0.92)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${dirty ? 'rgba(118,77,240,0.4)' : 'rgba(255,255,255,0.10)'}`,
        }}
      >
        <p className="text-xs" style={{ color: dirty ? '#a78bfa' : 'rgba(255,255,255,0.45)' }}>
          {dirty ? 'Unsaved changes' : 'All changes saved'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(180deg, oklch(0.62 0.24 291), oklch(0.48 0.22 291))',
            boxShadow: dirty ? '0 2px 16px rgba(118,77,240,0.3)' : 'none',
          }}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white/70 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function NumberRow({
  label, hint, value, onChange, width = 'w-24',
}: {
  label: string; hint?: string; value: number; onChange: (n: number) => void; width?: string;
}) {
  return (
    <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="min-w-0">
        <p className="text-white/70 text-sm font-semibold">{label}</p>
        {hint && <p className="text-white/45 text-[11px]">{hint}</p>}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={`${width} px-3 py-1.5 rounded-lg text-sm text-white text-right outline-none tabular-nums`}
        style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  );
}
