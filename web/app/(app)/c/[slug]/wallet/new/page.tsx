'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { idr } from '@/lib/format';

interface Pocket {
    id: string;
    name: string;
    type: string;
    balance: string;
}

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
}

export default function NewTransactionPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();

    // State untuk form transaksi
    const [amount, setAmount] = useState<string>('');
    const [direction, setDirection] = useState<'in' | 'out'>('out');
    const [pocketId, setPocketId] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // State data komunitas & akses
    const [community, setCommunity] = useState<Community | null>(null);
    const [pockets, setPockets] = useState<Pocket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Memuat data awal komunitas, akses role, dan kantong dompet
    useEffect(() => {
        let active = true;

        async function fetchInitData() {
            try {
                // Ambil daftar komunitas dan cari yang sesuai slug
                const list = await api.get<any[]>('/communities');
                const matchedComm = list.find((x: any) => x.slug === slug);
                if (!matchedComm) {
                    router.push('/dashboard');
                    return;
                }

                // Ambil data me/auth untuk mencocokkan membership
                const me = await api.get<any>('/auth/me');
                const members = await api.get<any[]>(`/communities/${matchedComm.id}/members`);
                const myMembership = members.find((m: any) => m.userId === me.id || m.user?.id === me.id);

                // Cek akses: hanya admin yang bisa mencatat transaksi baru secara manual
                if (!myMembership || myMembership.role !== 'admin') {
                    alert('Akses ditolak: Hanya pengurus/admin yang dapat mencatat transaksi baru.');
                    router.push(`/c/${slug}/wallet`);
                    return;
                }

                // Ambil daftar kantong dompet
                const pocketsList = await api.get<any[]>(`/communities/${matchedComm.id}/pockets`);

                if (active) {
                    setCommunity(matchedComm);
                    // Map balance ke string untuk kompatibilitas data
                    const mappedPockets = pocketsList.map(p => ({
                        ...p,
                        balance: p.balance.toString()
                    }));
                    setPockets(mappedPockets);

                    // Set default pocketId dari query param jika ada, jika tidak ambil pocket pertama
                    const params = new URLSearchParams(window.location.search);
                    const queryPocketId = params.get('pocketId');
                    const isValidPocket = mappedPockets.some(p => p.id === queryPocketId);

                    if (queryPocketId && isValidPocket) {
                        setPocketId(queryPocketId);
                    } else if (mappedPockets.length > 0) {
                        setPocketId(mappedPockets[0].id);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                router.push('/login');
            }
        }

        fetchInitData();

        return () => {
            active = false;
        };
    }, [slug, router]);

    // Handle input nominal agar hanya menerima angka
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setAmount(raw);
    };

    // Mengirim data form transaksi baru ke API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numericAmount = Number(amount);
        if (!amount || numericAmount <= 0) {
            setError('Silakan masukkan nominal transaksi yang valid.');
            return;
        }

        if (!pocketId) {
            setError('Pilih kantong dompet terlebih dahulu.');
            return;
        }

        if (!note.trim()) {
            setError('Keterangan transaksi wajib diisi.');
            return;
        }

        setSaving(true);
        try {
            // Append keterangan tanggal jika tanggal yang dipilih bukan hari ini
            const todayStr = new Date().toISOString().split('T')[0];
            const finalNote = date !== todayStr 
                ? `${note} (Tanggal: ${date})` 
                : note;

            await api.post(`/pockets/${pocketId}/transactions`, {
                amount: numericAmount,
                direction,
                note: finalNote,
                category: direction === 'in' ? 'pemasukan_manual' : 'pengeluaran_manual'
            });

            // Kembali ke halaman wallet setelah berhasil
            router.push(`/c/${slug}/wallet`);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan transaksi. Coba lagi.');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
                Memuat data formulir...
            </div>
        );
    }

    // Format tampilan nominal besar di header
    const displayAmount = amount ? idr(amount) : 'Rp 0';

    // Warna gradien dinamis untuk header berdasarkan tipe transaksi (Probe 2)
    const headerBgClass = direction === 'in'
        ? 'from-emerald-500 to-teal-600'
        : 'from-rose-500 to-red-600';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between pb-8">
            {/* Header Taktil Komunal dengan Gradien (Probe 2) */}
            <div className={`bg-gradient-to-br ${headerBgClass} text-white px-5 pt-8 pb-12 rounded-b-[32px] shadow-lg relative transition-all duration-500`}>
                <div className="max-w-lg mx-auto flex items-center justify-between mb-6">
                    <Link href={`/c/${slug}/wallet`} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                        <span className="text-lg">←</span>
                    </Link>
                    <span className="font-semibold text-sm tracking-wide">CATAT TRANSAKSI BARU</span>
                    <div className="w-8 h-8 opacity-0"></div>
                </div>

                {/* Jumlah Nominal Besar Terpusat */}
                <div className="max-w-lg mx-auto text-center mt-4">
                    <p className="text-xs opacity-75 uppercase tracking-widest mb-1">Nominal Transaksi</p>
                    <div className="relative inline-block w-full">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={displayAmount}
                            onChange={handleAmountChange}
                            className="w-full text-center text-4xl font-extrabold bg-transparent text-white focus:outline-none placeholder-white/50 tracking-tight"
                            placeholder="Rp 0"
                        />
                    </div>
                    <p className="text-xs opacity-60 mt-2">Ketuk angka di atas untuk mengetik nominal</p>
                </div>
            </div>

            {/* Form Input Section */}
            <div className="max-w-lg mx-auto w-full px-4 -mt-6 flex-1">
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-md border border-gray-100/50 space-y-5">
                    
                    {/* Tombol Pilihan Tipe Transaksi (Pemasukan vs Pengeluaran) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipe Transaksi</label>
                        <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200/50">
                            <button
                                type="button"
                                onClick={() => setDirection('out')}
                                className={`flex-1 py-2.5 text-xs rounded-full transition-all duration-300 font-bold flex items-center justify-center gap-1.5 ${
                                    direction === 'out'
                                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <span>↓</span> Pengeluaran
                            </button>
                            <button
                                type="button"
                                onClick={() => setDirection('in')}
                                className={`flex-1 py-2.5 text-xs rounded-full transition-all duration-300 font-bold flex items-center justify-center gap-1.5 ${
                                    direction === 'in'
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <span>↑</span> Pemasukan
                            </button>
                        </div>
                    </div>

                    {/* Tombol Nominal Cepat */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pilihan Nominal Cepat</label>
                        <div className="flex flex-wrap gap-2 justify-start">
                            {[10000, 50000, 100000, 500000].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                        const current = amount ? parseInt(amount, 10) : 0;
                                        setAmount((current + val).toString());
                                    }}
                                    className="text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-full font-medium transition active:scale-95 shadow-sm"
                                >
                                    + {val >= 1000 ? `${val / 1000}rb` : val}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setAmount('')}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-full font-semibold transition"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Dropdown Pilihan Kantong Dompet */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kantong Dompet</label>
                        <select
                            required
                            value={pocketId}
                            onChange={e => setPocketId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        >
                            {pockets.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Saldo: {idr(p.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tanggal Transaksi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                    </div>

                    {/* Keterangan Transaksi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Keterangan</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Pembelian sapu kas RT, konsumsi rapat"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                    </div>

                    {/* Tampilan Error */}
                    {error && (
                        <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Tombol Submit & Aksi */}
                    <div className="flex gap-3 pt-3">
                        <Link
                            href={`/c/${slug}/wallet`}
                            className="flex-1 text-center border border-gray-200 text-gray-500 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{ backgroundColor: 'var(--community-primary)' }}
                            className="flex-1 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-600/10 hover:brightness-105 transition disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {saving ? (
                                <span>Menyimpan...</span>
                            ) : (
                                <>
                                    <span>✓</span> Simpan Transaksi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
