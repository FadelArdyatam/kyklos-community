'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { idr, relativeTime } from '@/lib/format';

interface Txn { id: string; amount: string; direction: string; note?: string; category?: string; createdAt: string; member?: { name: string }; status: string }
interface Pocket { id: string; name: string; type: string; balance: string }

export default function PocketLedger() {
  const { pocketId, slug } = useParams<{ pocketId: string; slug: string }>();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [pocket, setPocket] = useState<Pocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', direction: 'in', note: '', category: '' });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Txn[]>(`/pockets/${pocketId}/transactions`),
      api.get<any[]>('/communities'),
      api.get<any>('/auth/me'),
    ]).then(([txns, communities, me]) => {
      setTxns(txns);
      const community = communities.find((c: any) => c.slug === slug);
      if (community) {
        api.get<any[]>(`/communities/${community.id}/members`).then(members => {
          const myMembership = members.find((m: any) => m.user.id === me.id || m.userId === me.id);
          setIsAdmin(myMembership?.role === 'admin');
        });
        api.get<any[]>(`/communities/${community.id}/pockets`).then(pockets => {
          const p = pockets.find((p: any) => p.id === pocketId);
          if (p) setPocket({ ...p, balance: p.balance.toString() });
        });
      }
      setLoading(false);
    });
  }, [pocketId, slug]);

  async function recordTxn(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/pockets/${pocketId}/transactions`, {
      amount: Number(form.amount), direction: form.direction, note: form.note, category: form.category,
    });
    setForm({ amount: '', direction: 'in', note: '', category: '' });
    setShowForm(false);
    const updated = await api.get<Txn[]>(`/pockets/${pocketId}/transactions`);
    setTxns(updated);
  }

  if (loading) return <div className="text-gray-400 text-sm text-center py-12">Memuat...</div>;

  return (
    <div className="space-y-4">
      {pocket && (
        <div className="rounded-2xl p-5 text-white" style={{ background: 'var(--community-primary)' }}>
          <p className="text-sm opacity-80">{pocket.name}</p>
          <p className="text-3xl font-bold">{idr(pocket.balance)}</p>
        </div>
      )}

      {isAdmin && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition text-sm">
              + Catat Transaksi
            </button>
          ) : (
            <form onSubmit={recordTxn} className="bg-white rounded-2xl shadow p-4 space-y-3">
              <div className="flex gap-2">
                {['in', 'out'].map(d => (
                  <button type="button" key={d} onClick={() => setForm(f => ({ ...f, direction: d }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${form.direction === d ? (d === 'in' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500') : 'border-gray-200 text-gray-500'}`}>
                    {d === 'in' ? '↑ Pemasukan' : '↓ Pengeluaran'}
                  </button>
                ))}
              </div>
              <input type="number" required placeholder="Jumlah (Rp)" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Keterangan" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-500">Batal</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium">Simpan</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Riwayat Transaksi</h3>
          <p className="text-xs text-gray-400">{txns.length} transaksi</p>
        </div>
        {txns.length === 0 && <p className="text-gray-400 text-sm p-4">Belum ada transaksi</p>}
        <div className="divide-y">
          {txns.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`text-xl ${t.direction === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                {t.direction === 'in' ? '↑' : '↓'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{t.note ?? t.category ?? '-'}</p>
                <p className="text-xs text-gray-400">{t.member?.name ?? 'Admin'} · {relativeTime(t.createdAt)}</p>
              </div>
              <span className={`text-sm font-semibold ${t.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                {t.direction === 'in' ? '+' : '-'}{idr(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
