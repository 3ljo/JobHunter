'use client';

import { useEffect, useState } from 'react';
import { getAdminPromos, createAdminPromo, updateAdminPromo, deleteAdminPromo } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Pencil, X, Check } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_amount: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function BosiPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountAmount, setDiscountAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editDiscountType, setEditDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [editDiscountAmount, setEditDiscountAmount] = useState('');
  const [editMaxUses, setEditMaxUses] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchPromos = () => {
    getAdminPromos()
      .then((res) => setPromos(res.data.promos || []))
      .catch(() => toast.error('Failed to load promo codes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminPromo({
        code: code.toUpperCase().trim(),
        discount_type: discountType,
        discount_amount: parseFloat(discountAmount),
        max_uses: maxUses ? parseInt(maxUses) : undefined,
        expires_at: expiresAt || undefined,
      });
      toast.success('Promo code created');
      setCode(''); setDiscountAmount(''); setMaxUses(''); setExpiresAt('');
      setShowForm(false);
      fetchPromos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create promo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: PromoCode) => {
    try {
      await updateAdminPromo(promo.id, { is_active: !promo.is_active });
      fetchPromos();
      toast.success(`Promo ${promo.is_active ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update promo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await deleteAdminPromo(id);
      fetchPromos();
      toast.success('Promo code deleted');
    } catch {
      toast.error('Failed to delete promo');
    }
  };

  const startEdit = (p: PromoCode) => {
    setEditingId(p.id);
    setEditCode(p.code);
    setEditDiscountType(p.discount_type);
    setEditDiscountAmount(String(p.discount_amount));
    setEditMaxUses(p.max_uses ? String(p.max_uses) : '');
    setEditExpiresAt(p.expires_at ? p.expires_at.slice(0, 16) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    setEditSaving(true);
    try {
      await updateAdminPromo(id, {
        code: editCode.toUpperCase().trim(),
        discount_type: editDiscountType,
        discount_amount: parseFloat(editDiscountAmount),
        max_uses: editMaxUses ? parseInt(editMaxUses) : null,
        expires_at: editExpiresAt || null,
      });
      toast.success('Promo code updated');
      setEditingId(null);
      fetchPromos();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update promo');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header + Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5" style={{ color: '#764DF0' }} />
          <h2 className="text-white text-xl font-black">Promo Codes</h2>
          <span className="text-white/40 text-sm">({promos.length})</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
          style={{
            background: 'linear-gradient(180deg, oklch(0.62 0.24 291), oklch(0.48 0.22 291))',
            boxShadow: '0 2px 16px rgba(118,77,240,0.3)',
          }}
        >
          <Plus className="h-4 w-4" />
          New Promo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl p-6 space-y-4"
          style={{ background: '#1a1e42', border: '1px solid rgba(118,77,240,0.3)' }}
        >
          <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-4">Create Promo Code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-1.5">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. NEWYEAR2026"
                className="w-full h-10 rounded-lg px-3 text-sm text-white placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-1.5">Discount Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: discountType === 'percent' ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
                    border: discountType === 'percent' ? '1px solid rgba(118,77,240,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: discountType === 'percent' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Percent %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className="flex-1 h-10 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: discountType === 'fixed' ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.04)',
                    border: discountType === 'fixed' ? '1px solid rgba(118,77,240,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: discountType === 'fixed' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Fixed $
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-1.5">
                {discountType === 'percent' ? 'Discount %' : 'Discount $'}
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 5.00'}
                min="1"
                max={discountType === 'percent' ? '100' : undefined}
                step={discountType === 'fixed' ? '0.01' : '1'}
                className="w-full h-10 rounded-lg px-3 text-sm text-white placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
                required
              />
              <p className="text-[10px] text-white/30 mt-1">
                {discountType === 'percent' ? 'Enter a number from 1 to 100 (e.g. 20 = 20% off)' : 'Enter a dollar amount (e.g. 5 = $5.00 off)'}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-1.5">Max Uses</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
                className="w-full h-10 rounded-lg px-3 text-sm text-white placeholder:text-white/25"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              />
              <p className="text-[10px] text-white/30 mt-1">
                How many times total this code can be used. Leave empty = unlimited.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 block mb-1.5">Expires At</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full h-10 rounded-lg px-3 text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', colorScheme: 'dark' }}
              />
              <p className="text-[10px] text-white/30 mt-1">
                Leave empty = never expires. The most recent active promo appears as a banner on the landing page.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, oklch(0.62 0.24 291), oklch(0.48 0.22 291))',
                boxShadow: '0 2px 16px rgba(118,77,240,0.3)',
              }}
            >
              {saving ? 'Creating...' : 'Create Promo Code'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-10 px-4 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Promo codes table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
        {promos.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">
            No promo codes yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Code</th>
                  <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Discount</th>
                  <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Uses</th>
                  <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Expires</th>
                  <th className="text-left p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Status</th>
                  <th className="text-right p-4 text-white/50 text-xs uppercase tracking-widest font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => {
                  const expired = p.expires_at && new Date(p.expires_at) < new Date();
                  const maxedOut = p.max_uses && p.times_used >= p.max_uses;
                  const isEditing = editingId === p.id;

                  if (isEditing) {
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(118,77,240,0.05)' }}>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                            className="w-full h-8 rounded-md px-2 text-sm text-white font-mono"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={editDiscountType}
                              onChange={(e) => setEditDiscountType(e.target.value as 'percent' | 'fixed')}
                              className="h-8 rounded-md px-1.5 text-xs text-white"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none', colorScheme: 'dark' }}
                            >
                              <option value="percent">%</option>
                              <option value="fixed">$</option>
                            </select>
                            <input
                              type="number"
                              value={editDiscountAmount}
                              onChange={(e) => setEditDiscountAmount(e.target.value)}
                              className="w-16 h-8 rounded-md px-2 text-sm text-white"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                              min="1"
                              max={editDiscountType === 'percent' ? '100' : undefined}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={editMaxUses}
                            onChange={(e) => setEditMaxUses(e.target.value)}
                            placeholder="∞"
                            className="w-16 h-8 rounded-md px-2 text-sm text-white placeholder:text-white/25"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }}
                            min="1"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="datetime-local"
                            value={editExpiresAt}
                            onChange={(e) => setEditExpiresAt(e.target.value)}
                            className="h-8 rounded-md px-1.5 text-xs text-white"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none', colorScheme: 'dark' }}
                          />
                        </td>
                        <td className="p-3">
                          <span
                            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: p.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: p.is_active ? '#34d399' : '#f87171',
                            }}
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(p.id)}
                              disabled={editSaving}
                              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                              title="Save"
                            >
                              {editSaving
                                ? <span className="h-3.5 w-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4">
                        <span className="text-white font-bold font-mono">{p.code}</span>
                      </td>
                      <td className="p-4 text-white/80">
                        {p.discount_type === 'percent' ? `${p.discount_amount}%` : `$${p.discount_amount}`} off
                      </td>
                      <td className="p-4 text-white/80 tabular-nums">
                        {p.times_used}{p.max_uses ? ` / ${p.max_uses}` : ' / ∞'}
                      </td>
                      <td className="p-4 text-white/60 text-xs">
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}
                        {expired && <span className="ml-1 text-red-400">(expired)</span>}
                      </td>
                      <td className="p-4">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: p.is_active && !expired && !maxedOut ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: p.is_active && !expired && !maxedOut ? '#34d399' : '#f87171',
                          }}
                        >
                          {!p.is_active ? 'Inactive' : expired ? 'Expired' : maxedOut ? 'Maxed' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="text-white/40 hover:text-violet-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(p)}
                            className="text-white/40 hover:text-white/80 transition-colors"
                            title={p.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {p.is_active ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
