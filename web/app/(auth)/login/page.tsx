'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Kyklos</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Dompet komunitas yang transparan</p>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-lg">Masuk</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-60">
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Belum punya akun? <Link href="/signup" className="text-indigo-600 font-medium">Daftar</Link>
          </p>
          <div className="border-t pt-3 text-xs text-gray-400 text-center">
            Demo: budi@demo.test / password123
          </div>
        </form>
      </div>
    </div>
  );
}
