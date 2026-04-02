'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { forgotPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileSearch, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-violet-500/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
              <FileSearch className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Reset password</CardTitle>
            <CardDescription className="text-zinc-400">
              {sent
                ? 'Check your email for a reset link'
                : 'Enter your email to receive a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 bg-zinc-800/50 border-zinc-700 focus:border-violet-500/50 focus:ring-violet-500/20"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="text-center text-sm text-zinc-400">
                <p className="mb-4">
                  We sent a password reset link to <span className="font-medium text-zinc-200">{email}</span>.
                </p>
                <Button variant="outline" onClick={() => setSent(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Try another email
                </Button>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-zinc-500">
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
