'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface DashboardData {
    totalBalance: string;
    pockets: Array<{ id: string; name: string; type: string; balance: string }>;
    recentTransactions: Array<{
        id: string;
        amount: string;
        direction: string;
        note?: string;
        createdAt: string;
        member?: { name: string };
    }>;
    members: Array<{ user: { name: string } }>;
}

export default function CommunityHome() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [communityId, setCommunityId] = useState<string>('');
    const [timeTab, setTimeTab] = useState<'today' | 'week' | 'month'>('month');
    const [showPocketForm, setShowPocketForm] = useState<boolean>(false);
    const [newPocketName, setNewPocketName] = useState<string>('');
    const [newPocketType, setNewPocketType] = useState<string>('treasury');
    const [pocketSaving, setPocketSaving] = useState<boolean>(false);

    // Memuat data dasbor utama komunitas
    const loadDashboard = () => {
        api.get<any[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug);
            if (!c) return;
            setCommunityId(c.id);
            return api.get<DashboardData>(`/communities/${c.id}/dashboard`);
        }).then(d => {
            if (d) setData(d);
        }).catch(() => router.push('/login'));
    };

    useEffect(() => {
        loadDashboard();
    }, [slug, router]);

    // Membuat kantong dompet baru secara langsung (Create Pocket)
    const handleCreatePocket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPocketName.trim()) return;

        setPocketSaving(true);
        try {
            await api.post(`/communities/${communityId}/pockets`, {
                name: newPocketName,
                type: newPocketType
            });
            setNewPocketName('');
            setShowPocketForm(false);
            loadDashboard(); // Muat ulang data
        } catch (err) {
            console.error('Gagal membuat kantong:', err);
        } finally {
            setPocketSaving(false);
        }
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
                Memuat dasbor...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bagian Atas: Overview Header & Actions (Persis KUYY!) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Overview</h1>
                </div>

                {/* Tombol Aksi di Kanan */}
                <div className="flex items-center gap-3">
                    <Link
                        href={`/c/${slug}/wallet/new`}
                        className="bg-[#ff6b00] hover:bg-[#e05e00] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-orange-600/10 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                        <span className="text-lg">+</span> Catat Transaksi
                    </Link>
                    <button
                        onClick={() => setShowPocketForm(true)}
                        className="border border-[#ff6b00] hover:bg-orange-50 text-[#ff6b00] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                        <span>📁</span> Buat Kantong
                    </button>
                </div>
            </div>

            {/* Filter Waktu (Today, This Week, This Month) */}
            <div className="flex gap-2">
                {[
                    { key: 'today', label: 'Hari Ini' },
                    { key: 'week', label: 'Minggu Ini' },
                    { key: 'month', label: 'Bulan Ini' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setTimeTab(tab.key as any)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                            timeTab === tab.key
                                ? 'bg-orange-50 text-[#ff6b00]'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form Drawer / Modal untuk Pembuatan Kantong Baru */}
            {showPocketForm && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <form onSubmit={handleCreatePocket} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
                        <h3 className="text-lg font-black text-gray-800">📁 Buat Kantong Dompet Baru</h3>
                        <div className="space-y-3">
                            <input
                                required
                                placeholder="Nama Kantong (misal: Kas Sosial, Event RT)"
                                value={newPocketName}
                                onChange={e => setNewPocketName(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00]"
                            />
                            <select
                                value={newPocketType}
                                onChange={e => setNewPocketType(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/20 focus:border-[#ff6b00]"
                            >
                                <option value="treasury">Kas Utama (Treasury)</option>
                                <option value="arisan">Arisan (Saving Scheme)</option>
                                <option value="dues">Iuran (Dues/Contributions)</option>
                                <option value="event">Acara (Event Fund)</option>
                            </select>
                        </div>
                        <div className="flex gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPocketForm(false)}
                                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={pocketSaving}
                                className="flex-1 bg-[#ff6b00] hover:bg-[#e05e00] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60"
                            >
                                {pocketSaving ? 'Memproses...' : 'Buat Kantong'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid Kartu Metrik Ringkasan (Aesthetic Overview Cards dari KUYY!) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Saldo */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg">
                            💰
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Saldo</span>
                    </div>
                    <div className="mt-3">
                        <p className="text-lg font-black text-gray-800 tracking-tight">{idr(data.totalBalance)}</p>
                    </div>
                </div>

                {/* Card 2: Kantong Aktif */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg">
                            📁
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kantong Aktif</span>
                    </div>
                    <div className="mt-3">
                        <p className="text-lg font-black text-gray-800 tracking-tight">{data.pockets.length} Kantong</p>
                    </div>
                </div>

                {/* Card 3: Anggota Aktif */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg">
                            👥
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Anggota</span>
                    </div>
                    <div className="mt-3">
                        <p className="text-lg font-black text-gray-800 tracking-tight">{data.members.length} Anggota</p>
                    </div>
                </div>

                {/* Card 4: Transaksi Terbaru */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg">
                            📊
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Transaksi Baru</span>
                    </div>
                    <div className="mt-3">
                        <p className="text-lg font-black text-gray-800 tracking-tight">{data.recentTransactions.length} Tercatat</p>
                    </div>
                </div>
            </div>

            {/* Bagian Kantong Dompet */}
            <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-800 tracking-tight">Daftar Kantong Komunitas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.pockets.map(p => (
                        <Link
                            key={p.id}
                            href={`/c/${slug}/wallet/${p.id}`}
                            className="bg-white rounded-2xl border border-gray-200/85 p-5 shadow-sm hover:shadow hover:border-orange-300 transition duration-300 flex flex-col justify-between min-h-[130px]"
                        >
                            <div>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                    {p.type}
                                </span>
                                <h3 className="font-bold text-gray-800 mt-2 text-sm truncate">{p.name}</h3>
                            </div>
                            <div className="flex items-end justify-between mt-4">
                                <span className="text-base font-extrabold text-gray-800">{idr(p.balance)}</span>
                                <span className="text-gray-300 font-bold text-lg">›</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bagian Earnings / Transaksi Terbaru (Desain Persis KUYY! Center Container) */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <h3 className="font-black text-gray-800 text-base">Riwayat Transaksi Terbaru</h3>
                    <select className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white text-gray-600 focus:outline-none">
                        <option>Terbaru</option>
                        <option>Bulanan</option>
                    </select>
                </div>

                {data.recentTransactions.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                        Belum ada riwayat transaksi
                    </div>
                ) : (
                    <div className="space-y-4 divide-y divide-gray-50">
                        {data.recentTransactions.slice(0, 5).map((t, idx) => (
                            <div key={t.id} className={`flex items-center gap-4 ${idx > 0 ? 'pt-4' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                    t.direction === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    {t.direction === 'in' ? '↑' : '↓'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {t.note ?? (t.direction === 'in' ? 'Pemasukan' : 'Pengeluaran')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Oleh {t.member?.name ?? 'Admin'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-black ${
                                        t.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                        {t.direction === 'in' ? '+' : '-'}{idr(t.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
