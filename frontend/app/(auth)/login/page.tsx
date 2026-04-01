'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      setToken(res.data.session.access_token);
      setUser(res.data.user);
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sign in');
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
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your JobHunter account</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500 space-y-1">
            <p>
              <Link href="/forgot-password" className="text-gray-900 hover:underline">
                Forgot password?
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-gray-900 hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
