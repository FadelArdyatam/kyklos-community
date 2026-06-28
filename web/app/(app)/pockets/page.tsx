'use client';

import { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CommunityContext } from '../layout';

interface Pocket {
    id: string;
    name: string;
    type: 'KAS' | 'ARISAN' | 'DARURAT' | string;
    description: string;
    balance: number;
    status: string;
    targetAmount?: number;
}

export default function PocketsPage() {
    const router = useRouter();
    const [slug, setSlug] = useState<string>('keluarga-cemara');
    const [communityId, setCommunityId] = useState<string>('');
    const [pockets, setPockets] = useState<Pocket[]>([]);
    const [loading, setLoading] = useState(true);

    const { role } = useContext(CommunityContext);

    const [showNewPocketModal, setShowNewPocketModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState<{
        type: 'deposit' | 'expense' | 'disburse';
        pocketId?: string;
    } | null>(null);

    const [newPocketForm, setNewPocketForm] = useState({
        name: '',
        type: 'KAS',
        description: '',
    });

    const [txForm, setTxForm] = useState({
        amount: '',
        notes: ''
    });

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    const loadPockets = () => {
        setLoading(true);
        api.get<any[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
            setCommunityId(c.id);
            return api.get<Pocket[]>(`/communities/${c.id}/pockets`);
        }).then(res => {
            if (res) setPockets(res);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to load pockets', err);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadPockets();
    }, [slug, router]);

    const totalLiquidity = pockets.reduce((sum, p) => sum + Number(p.balance), 0);

    const handleCreatePocket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPocketForm.name.trim()) return;
        try {
            await api.post(`/communities/${communityId}/pockets`, newPocketForm);
            setShowNewPocketModal(false);
            setNewPocketForm({ name: '', type: 'KAS', description: '' });
            loadPockets();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat kantong.');
        }
    };

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showTransactionModal?.pocketId) return;

        const amountNum = parseFloat(txForm.amount) || 0;
        if (amountNum <= 0 && showTransactionModal.type !== 'disburse') return;

        const pId = showTransactionModal.pocketId;
        const type = showTransactionModal.type;

        try {
            if (type === 'disburse') {
                await api.post(`/pockets/${pId}/withdraw`, {
                    amount: pockets.find(p => p.id === pId)?.balance || 0,
                    note: txForm.notes || 'Pencairan arisan/dana',
                    bankName: 'BCA',
                    accountNumber: '000000',
                    accountHolder: 'Penerima'
                });
                alert('Permintaan penarikan telah diajukan dan menunggu persetujuan.');
            } else {
                await api.post(`/pockets/${pId}/transactions`, {
                    amount: amountNum,
                    type: type === 'deposit' ? 'in' : 'out',
                    description: txForm.notes || 'Transaksi'
                });
            }
            setShowTransactionModal(null);
            setTxForm({ amount: '', notes: '' });
            loadPockets();
        } catch (err: any) {
            alert(err.message || 'Gagal memproses transaksi.');
        }
    };

    const handleDeletePocket = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus kantong kas ini?')) {
            try {
                await api.delete(`/pockets/${id}`);
                loadPockets();
            } catch (err: any) {
                alert(err.message || 'Gagal menghapus kantong kas.');
            }
        }
    };

    const idr = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const typeIcon: Record<string, React.ReactNode> = {
        KAS: (
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4m0 0H9m3 0h3" />
            </svg>
        ),
        ARISAN: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        DARURAT: (
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    };

    const defaultIcon = (
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                    <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Pockets</h1>
                    <p className="text-xs text-gray-400 font-semibold">Manage and track your distributed funds.</p>
                </div>
                {role === 'admin' && (
                    <button
                        onClick={() => setShowNewPocketModal(true)}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer w-full sm:w-auto"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Pocket
                    </button>
                )}
            </div>

            {/* ── Total Liquidity Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm w-full sm:max-w-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Liquidity</span>
                <p className="font-serif text-2xl font-black text-slate-800 tracking-tight mt-2">
                    {loading ? '—' : idr(totalLiquidity)}
                </p>
            </div>

            {/* ── Pocket Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse">
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                            <div className="h-5 bg-slate-100 rounded w-3/4" />
                        </div>
                    ))
                ) : pockets.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-500">Belum ada kantong kas</p>
                        <p className="text-xs text-gray-400 mt-1">Buat kantong pertama untuk mulai mencatat keuangan komunitas.</p>
                    </div>
                ) : pockets.map((p) => {
                    const isArisan = p.type === 'ARISAN';
                    return (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex flex-col gap-4">
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                        {typeIcon[p.type] ?? defaultIcon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-serif text-base font-bold text-slate-800 leading-tight truncate">{p.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide truncate">{p.description || p.type}</p>
                                    </div>
                                </div>
                                {role === 'admin' && (
                                    <button
                                        onClick={() => handleDeletePocket(p.id)}
                                        className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Balance */}
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
                                <p className="font-serif text-2xl font-black text-primary tracking-tight mt-0.5">{idr(p.balance)}</p>
                            </div>

                            {/* Admin Action Buttons */}
                            {role === 'admin' && (
                                <div className="flex flex-col gap-2 mt-auto">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setShowTransactionModal({ type: 'deposit', pocketId: p.id })}
                                            className="py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 transition cursor-pointer"
                                        >Deposit</button>
                                        <button
                                            onClick={() => setShowTransactionModal({ type: 'expense', pocketId: p.id })}
                                            className="py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-50 transition cursor-pointer"
                                        >Log Expense</button>
                                    </div>
                                    {isArisan && (
                                        <button
                                            onClick={() => setShowTransactionModal({ type: 'disburse', pocketId: p.id })}
                                            className="w-full py-2 border border-[#0284C7] text-[#0284C7] rounded-xl text-xs font-bold hover:bg-sky-50 transition cursor-pointer"
                                        >Tarik (Disburse)</button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Modal: Buat Kantong Baru ── */}
            {showNewPocketModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
                    <form
                        onSubmit={handleCreatePocket}
                        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-lg font-bold">Buat Kantong Baru</h3>
                            <button type="button" onClick={() => setShowNewPocketModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <input
                            type="text" required value={newPocketForm.name}
                            onChange={e => setNewPocketForm({ ...newPocketForm, name: e.target.value })}
                            placeholder="Nama Kantong"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                        />
                        <select
                            value={newPocketForm.type}
                            onChange={e => setNewPocketForm({ ...newPocketForm, type: e.target.value })}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm bg-white focus:outline-none focus:border-primary"
                        >
                            <option value="KAS">🏦 Kas Umum</option>
                            <option value="ARISAN">🔄 Arisan</option>
                            <option value="DARURAT">🚨 Darurat / Sosial</option>
                        </select>
                        <input
                            type="text" value={newPocketForm.description}
                            onChange={e => setNewPocketForm({ ...newPocketForm, description: e.target.value })}
                            placeholder="Deskripsi Singkat (opsional)"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setShowNewPocketModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-slate-600 hover:bg-gray-200 transition cursor-pointer">Batal</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-90 transition cursor-pointer">Buat Kantong</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Modal: Transaksi ── */}
            {showTransactionModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
                    <form
                        onSubmit={handleTransactionSubmit}
                        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-lg font-bold">
                                {showTransactionModal.type === 'deposit' ? 'Deposit Dana' :
                                    showTransactionModal.type === 'expense' ? 'Log Expense' :
                                        'Tarik Dana'}
                            </h3>
                            <button type="button" onClick={() => setShowTransactionModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {showTransactionModal.type !== 'disburse' && (
                            <input
                                type="number" required value={txForm.amount}
                                onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                placeholder="Jumlah Rupiah"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                            />
                        )}
                        <input
                            type="text" value={txForm.notes}
                            onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                            placeholder="Catatan Transaksi"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setShowTransactionModal(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-slate-600 hover:bg-gray-200 transition cursor-pointer">Batal</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-90 transition cursor-pointer">Proses</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
