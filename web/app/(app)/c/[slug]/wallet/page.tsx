'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { idr, relativeTime } from '@/lib/format';

interface DashboardData {
  totalBalance: string;
  pockets: Array<{ id: string; name: string; type: string; balance: string }>;
  recentTransactions: Array<{
    id: string; amount: string; direction: string; note?: string; category?: string;
    createdAt: string; member?: { name: string }; pocket?: { name: string };
  }>;
  contributions: Array<{
    id: string; amount: string; status: string;
    member: { id: string; name: string; email: string };
    schedule?: { title: string };
  }>;
  members: Array<{ userId: string; role: string; user: { id: string; name: string } }>;
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Lunas', pending_verify: 'Menunggu', unpaid: 'Belum Bayar', late: 'Terlambat',
};
const STATUS_COLOR: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending_verify: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-600', late: 'bg-orange-100 text-orange-700',
};

export default function WalletPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [communityId, setCommunityId] = useState('');
  const [tab, setTab] = useState<'ledger' | 'status'>('status');
  const [myId, setMyId] = useState('');
  const [payConfig, setPayConfig] = useState<{ method: string } | null>(null);

  // Periksa apakah user login adalah pengurus/admin
  const myMembership = data?.members?.find(m => m.userId === myId || m.user?.id === myId);
  const isAdmin = myMembership?.role === 'admin';

  const load = useCallback(() => {
    getMe().then(me => me && setMyId(me.id));
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      api.get<any>(`/communities/${c.id}/payment-config`).then(cfg => cfg && setPayConfig(cfg)).catch(() => {});
      return api.get<DashboardData>(`/communities/${c.id}/dashboard`);
    }).then(d => d && setData(d)).catch(() => router.push('/login'));
  }, [slug, router]);

  useEffect(() => { load(); }, [load]);

  // Refetch every 15s for live-ish feel
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function payWithMidtrans(contributionId: string) {
    const res = await api.post<{ token: string; clientKey: string }>(`/contributions/${contributionId}/pay`, {});
    // Load Midtrans Snap JS if not yet loaded
    if (!(window as any).snap) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        s.setAttribute('data-client-key', res.clientKey);
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    (window as any).snap.pay(res.token, {
      onSuccess: () => { load(); },
      onPending: () => { load(); },
      onError: (err: any) => { console.error(err); },
    });
  }

  if (!data) return <div className="text-gray-400 text-sm text-center py-12">Memuat dompet...</div>;

  // Group contributions by member for payment status view
  const byMember: Record<string, { name: string; statuses: string[] }> = {};
  for (const c of data.contributions) {
    if (!byMember[c.member.id]) byMember[c.member.id] = { name: c.member.name, statuses: [] };
    byMember[c.member.id].statuses.push(c.status);
  }

  return (
    <div className="space-y-4">
      {/* Hero balance */}
      <div className="rounded-2xl p-6 text-white text-center" style={{ background: 'var(--community-primary)' }}>
        <p className="text-sm opacity-80">Total Saldo Komunitas</p>
        <p className="text-4xl font-bold mt-1">{idr(data.totalBalance)}</p>
        <p className="text-xs opacity-60 mt-2">Diperbarui otomatis setiap 15 detik</p>
      </div>

      {/* Pocket cards */}
      <div className="grid grid-cols-2 gap-3">
        {data.pockets.map(p => (
          <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 capitalize">{p.type}</p>
            <p className="text-sm font-semibold truncate">{p.name}</p>
            <p className="text-lg font-bold mt-1">{idr(p.balance)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {(['status', 'ledger'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm rounded-lg transition font-medium ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {t === 'status' ? 'Status Bayar' : 'Buku Kas'}
          </button>
        ))}
      </div>

      {tab === 'status' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Status Pembayaran Anggota</h3>
            <p className="text-xs text-gray-400">Semua anggota bisa melihat ini</p>
          </div>
          {data.contributions.length === 0 && (
            <p className="text-gray-400 text-sm p-4">Belum ada iuran terdaftar</p>
          )}
          <div className="divide-y">
            {data.contributions.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {c.member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.member.name}</p>
                  <p className="text-xs text-gray-400">{c.schedule?.title ?? 'Iuran'} · {idr(c.amount)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  {c.member.id === myId && c.status === 'unpaid' && payConfig?.method === 'gateway' && (
                    <button onClick={() => payWithMidtrans(c.id)}
                      className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full hover:bg-blue-700 transition">
                      Bayar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm">Buku Kas (Ledger)</h3>
              <p className="text-xs text-gray-400">Append-only · tidak bisa dihapus</p>
            </div>
            {isAdmin && (
              <Link href={`/c/${slug}/wallet/new`}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-sm cursor-pointer">
                + Transaksi Baru
              </Link>
            )}
          </div>
          {data.recentTransactions.length === 0 && (
            <p className="text-gray-400 text-sm p-4">Belum ada transaksi</p>
          )}
          <div className="divide-y">
            {data.recentTransactions.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-xl ${t.direction === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.direction === 'in' ? '↑' : '↓'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{t.note ?? t.category ?? (t.direction === 'in' ? 'Pemasukan' : 'Pengeluaran')}</p>
                  <p className="text-xs text-gray-400">{t.pocket?.name} · {relativeTime(t.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${t.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.direction === 'in' ? '+' : '-'}{idr(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
