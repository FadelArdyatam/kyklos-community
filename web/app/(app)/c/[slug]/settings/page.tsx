'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [communityId, setCommunityId] = useState('');
  const [form, setForm] = useState({
    method: 'manual_transfer',
    bankName: '', accountNumber: '', accountHolder: '',
    gatewayProvider: 'midtrans', serverKey: '', clientKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      return api.get<any>(`/communities/${c.id}/payment-config`);
    }).then(cfg => {
      if (!cfg) return;
      setForm(f => ({
        ...f,
        method: cfg.method ?? 'manual_transfer',
        bankName: cfg.bankName ?? '',
        accountNumber: cfg.accountNumber ?? '',
        accountHolder: cfg.accountHolder ?? '',
        gatewayProvider: cfg.gatewayProvider ?? 'midtrans',
      }));
    }).catch(() => router.push('/login'));
  }, [slug, router]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    await api.put(`/communities/${communityId}/payment-config`, form);
    setSaved(true); setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold">Pengaturan Pembayaran</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Metode</label>
          <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="manual_transfer">Transfer Manual</option>
            <option value="gateway">Payment Gateway (Midtrans)</option>
          </select>
        </div>

        {form.method === 'manual_transfer' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Nama Bank</label>
              <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                placeholder="BCA / BRI / Mandiri" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Rekening</label>
              <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Atas Nama</label>
              <input value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </>
        )}

        {form.method === 'gateway' && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
              ⚠️ Gunakan Sandbox Key dari dashboard.sandbox.midtrans.com — bukan uang asli.
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Server Key (Sandbox)</label>
              <input type="password" value={form.serverKey} onChange={e => setForm(f => ({ ...f, serverKey: e.target.value }))}
                placeholder="SB-Mid-server-xxxx" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Key (Sandbox)</label>
              <input value={form.clientKey} onChange={e => setForm(f => ({ ...f, clientKey: e.target.value }))}
                placeholder="SB-Mid-client-xxxx" className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-60">
          {saved ? '✓ Tersimpan' : loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
