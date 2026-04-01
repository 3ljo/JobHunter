'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { forgotPassword } from '@/lib/api';
import toast from 'react-hot-toast';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white text-lg font-bold">
            JH
          </div>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your email for a reset link'
              : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <div className="text-center text-sm text-gray-600">
              <p className="mb-4">
                We sent a password reset link to <span className="font-medium">{email}</span>.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Try another email
              </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-gray-500">
            <Link href="/login" className="text-gray-900 hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
