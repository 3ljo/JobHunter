'use client';

import { useEffect, useState } from 'react';
import { getAdminUsers } from '@/lib/api';
import { Search, FileText, Briefcase, Zap, DollarSign } from 'lucide-react';

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  cv_count: number;
  job_count: number;
  api_calls: number;
  api_cost: number;
}

export default function BosiUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = users.reduce((sum, u) => sum + u.api_cost, 0);

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Users</p>
          <p className="text-white text-2xl font-black">{users.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total CVs</p>
          <p className="text-white text-2xl font-black">{users.reduce((s, u) => s + u.cv_count, 0)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Jobs</p>
          <p className="text-white text-2xl font-black">{users.reduce((s, u) => s + u.job_count, 0)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold mb-1">Total API Cost</p>
          <p className="text-white text-2xl font-black">${totalCost.toFixed(4)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/40 outline-none"
          style={{
            background: '#1a1e42',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#1a1e42', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] text-white/60 uppercase tracking-widest font-bold"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Joined</div>
          <div className="col-span-1 text-center">CVs</div>
          <div className="col-span-1 text-center">Jobs</div>
          <div className="col-span-2 text-center">API Calls</div>
          <div className="col-span-2 text-center">Cost</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/50 text-sm">
            {search ? 'No users match your search' : 'No users yet'}
          </div>
        ) : (
          filtered.map((user, i) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.04] transition-colors"
              style={{
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(118,77,240,0.2)', color: '#a78bfa' }}
                >
                  {(user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.full_name || 'No name'}</p>
                  <p className="text-white/50 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <div className="col-span-2 text-center text-white/60 text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-white/80 text-xs">
                  <FileText className="h-3 w-3 text-white/40" /> {user.cv_count}
                </span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-white/80 text-xs">
                  <Briefcase className="h-3 w-3 text-white/40" /> {user.job_count}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="inline-flex items-center gap-1 text-white/80 text-xs">
                  <Zap className="h-3 w-3 text-white/40" /> {user.api_calls}
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-mono" style={{ color: user.api_cost > 0 ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                  <DollarSign className="h-3 w-3" /> {user.api_cost.toFixed(4)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
