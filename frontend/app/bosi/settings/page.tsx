'use client';

import { useEffect, useState } from 'react';
import { getAdminSettings, updateAdminSettings } from '@/lib/api';
import { Cpu, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppSettings {
  ai_provider: string;
  ai_model_anthropic: string;
  ai_model_openai: string;
  ai_model_gemini: string;
  max_tokens: number;
  rate_limit_cv_per_day: number;
  rate_limit_cl_per_day: number;
}

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    color: '#34d399',
    description: 'Cheapest option. Free tier available (1,500 req/day).',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  {
    id: 'openai',
    name: 'OpenAI ChatGPT',
    color: '#60a5fa',
    description: 'Great balance of quality and cost.',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    color: '#c084fc',
    description: 'Highest quality, most expensive.',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  },
];

export default function BosiSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [costTable, setCostTable] = useState<Record<string, { input: number; output: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAdminSettings()
      .then((res) => {
        setSettings(res.data.settings);
        setCostTable(res.data.costTable);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleProviderSwitch = (provider: string) => {
    if (!settings) return;
    setSettings({ ...settings, ai_provider: provider });
    setSaved(false);
  };

  const handleModelChange = (provider: string, model: string) => {
    if (!settings) return;
    setSettings({ ...settings, [`ai_model_${provider}`]: model });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      setSaved(true);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
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

  if (!settings) return <p className="text-white/60">Failed to load settings</p>;

  const activeProvider = PROVIDERS.find((p) => p.id === settings.ai_provider);

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Provider Selection */}
      <div>
        <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5" /> AI Provider
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROVIDERS.map((provider) => {
            const active = settings.ai_provider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => handleProviderSwitch(provider.id)}
                className="rounded-xl p-5 text-left transition-all duration-200"
                style={{
                  background: active ? `${provider.color}10` : '#1a1e42',
                  border: active ? `2px solid ${provider.color}` : '2px solid rgba(255,255,255,0.10)',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: provider.color }} />
                    <span className="text-white text-sm font-bold">{provider.name}</span>
                  </div>
                  {active && <CheckCircle className="h-4 w-4" style={{ color: provider.color }} />}
                </div>
                <p className="text-white/60 text-xs leading-relaxed">{provider.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection per Provider */}
      <div>
        <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4">
          Model Configuration
        </h3>
        <div className="space-y-4">
          {PROVIDERS.map((provider) => {
            const modelKey = `ai_model_${provider.id}` as keyof AppSettings;
            const currentModel = settings[modelKey] as string;
            const isActive = settings.ai_provider === provider.id;

            return (
              <div
                key={provider.id}
                className="rounded-xl p-4"
                style={{
                  background: '#1a1e42',
                  border: isActive ? `1px solid ${provider.color}44` : '1px solid rgba(255,255,255,0.10)',
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: provider.color }} />
                    <p className="text-white/70 text-sm font-semibold">{provider.name} Model</p>
                    {isActive && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: provider.color, background: `${provider.color}18` }}>
                        Active
                      </span>
                    )}
                  </div>
                  <select
                    value={currentModel}
                    onChange={(e) => handleModelChange(provider.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs text-white/70 outline-none cursor-pointer"
                    style={{
                      background: '#141736',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {provider.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {/* Cost info */}
                {costTable[currentModel] && (
                  <div className="mt-2 flex gap-4 text-[10px] text-white/55">
                    <span>Input: ${costTable[currentModel].input}/1M tokens</span>
                    <span>Output: ${costTable[currentModel].output}/1M tokens</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* General Settings */}
      <div>
        <h3 className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-4">
          General Settings
        </h3>
        <div className="space-y-4">
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div>
              <p className="text-white/70 text-sm font-semibold">Max Tokens per AI Call</p>
              <p className="text-white/55 text-xs">Controls max response length for all AI calls</p>
            </div>
            <input
              type="number"
              value={settings.max_tokens}
              onChange={(e) => { setSettings({ ...settings, max_tokens: parseInt(e.target.value) || 4000 }); setSaved(false); }}
              className="w-24 px-3 py-1.5 rounded-lg text-xs text-white/70 text-right outline-none"
              style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div>
              <p className="text-white/70 text-sm font-semibold">CV Analyses / User / Day</p>
              <p className="text-white/55 text-xs">Rate limit for free users</p>
            </div>
            <input
              type="number"
              value={settings.rate_limit_cv_per_day}
              onChange={(e) => { setSettings({ ...settings, rate_limit_cv_per_day: parseInt(e.target.value) || 10 }); setSaved(false); }}
              className="w-24 px-3 py-1.5 rounded-lg text-xs text-white/70 text-right outline-none"
              style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div>
              <p className="text-white/70 text-sm font-semibold">Cover Letters / User / Day</p>
              <p className="text-white/55 text-xs">Rate limit for free users</p>
            </div>
            <input
              type="number"
              value={settings.rate_limit_cl_per_day}
              onChange={(e) => { setSettings({ ...settings, rate_limit_cl_per_day: parseInt(e.target.value) || 20 }); setSaved(false); }}
              className="w-24 px-3 py-1.5 rounded-lg text-xs text-white/70 text-right outline-none"
              style={{ background: '#141736', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
        style={{
          background: saved ? 'rgba(52,211,153,0.15)' : 'rgba(118,77,240,0.2)',
          color: saved ? '#34d399' : '#a78bfa',
          border: saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(118,77,240,0.3)',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
