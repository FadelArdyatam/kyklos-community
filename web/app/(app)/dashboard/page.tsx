'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getMe, logout } from '@/lib/auth';

interface Community { id: string; name: string; slug: string; themeColor: string; logoUrl?: string; _count: { memberships: number } }

export default function DashboardPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(u => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      api.get<Community[]>('/communities').then(c => { setCommunities(c); setLoading(false); });
    });
  }, [router]);

  function handleLogout() { logout(); router.push('/login'); }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Memuat...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Kyklos</h1>
          <p className="text-sm text-gray-500">Halo, {user?.name}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Keluar</button>
      </div>

      <div className="space-y-3">
        {communities.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada komunitas. Buat sekarang!</p>
        )}
        {communities.map(c => (
          <Link key={c.id} href={`/c/${c.slug}`}
            className="flex items-center gap-4 bg-white rounded-2xl shadow-sm p-4 hover:shadow transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: c.themeColor }}>
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-sm text-gray-500">{c._count.memberships} anggota</p>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>

      <CreateCommunity onCreate={c => setCommunities(prev => [...prev, c])} />
    </div>
  );
}

function CreateCommunity({ onCreate }: { onCreate: (c: Community) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const c = await api.post<Community>('/communities', { name, slug });
    onCreate(c); setOpen(false); setName(''); setLoading(false);
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition">
          + Buat Komunitas Baru
        </button>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow p-4 space-y-3">
          <input required placeholder="Nama komunitas" value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-500">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
              {loading ? '...' : 'Buat'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
