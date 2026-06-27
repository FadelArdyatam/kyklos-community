'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface DashboardData {
  totalBalance: string;
  pockets: Array<{ id: string; name: string; type: string; balance: string }>;
  recentTransactions: Array<{ id: string; amount: string; direction: string; note?: string; createdAt: string; member?: { name: string } }>;
  members: Array<{ user: { name: string } }>;
}

export default function CommunityHome() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [communityId, setCommunityId] = useState('');

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      return api.get<DashboardData>(`/communities/${c.id}/dashboard`);
    }).then(d => d && setData(d)).catch(() => router.push('/login'));
  }, [slug, router]);

  if (!data) return <div className="text-gray-400 text-sm text-center py-12">Memuat...</div>;

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="rounded-2xl p-5 text-white" style={{ background: 'var(--community-primary)' }}>
        <p className="text-sm opacity-80 mb-1">Total Saldo Komunitas</p>
        <p className="text-3xl font-bold">{idr(data.totalBalance)}</p>
        <Link href={`/c/${slug}/wallet`} className="inline-block mt-3 text-sm bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition">
          Lihat Dompet Lengkap →
        </Link>
      </div>

      {/* Pockets */}
      <div className="grid grid-cols-2 gap-3">
        {data.pockets.map(p => (
          <Link key={p.id} href={`/c/${slug}/wallet/${p.id}`}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow transition">
            <p className="text-xs text-gray-500 capitalize">{p.type}</p>
            <p className="font-semibold text-sm truncate">{p.name}</p>
            <p className="text-base font-bold mt-1">{idr(p.balance)}</p>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold mb-3 text-sm">Transaksi Terbaru</h3>
        {data.recentTransactions.length === 0 && <p className="text-gray-400 text-sm">Belum ada transaksi</p>}
        <div className="space-y-2">
          {data.recentTransactions.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <span className={`text-lg ${t.direction === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                {t.direction === 'in' ? '↑' : '↓'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.note ?? (t.direction === 'in' ? 'Pemasukan' : 'Pengeluaran')}</p>
                <p className="text-xs text-gray-400">{t.member?.name ?? 'Admin'}</p>
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
