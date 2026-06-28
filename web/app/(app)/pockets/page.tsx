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
    const [communityName, setCommunityName] = useState<string>('Kyklos');
    const [pockets, setPockets] = useState<Pocket[]>([]);
    const [loading, setLoading] = useState(true);

    const { role } = useContext(CommunityContext);

    const getPocketVA = (p: Pocket) => {
        let hash = 0;
        for (let i = 0; i < p.id.length; i++) {
            hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const val = Math.abs(hash).toString().padEnd(8, '7').slice(0, 8);
        return `8802-${val.slice(0, 4)}-${val.slice(4, 8)}`;
    };

    const getPocketVAName = (cName: string, pName: string) => {
        const cleanCommunity = cName.slice(0, 15).toUpperCase();
        const cleanPocket = pName.slice(0, 10).toUpperCase();
        return `KYK*${cleanCommunity}*${cleanPocket}`;
    };

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

    const [selectedPocket, setSelectedPocket] = useState<Pocket | null>(null);
    const [pocketTxns, setPocketTxns] = useState<any[]>([]);
    const [loadingTxns, setLoadingTxns] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [submittingTx, setSubmittingTx] = useState(false);

    const handleOpenDetail = async (p: Pocket) => {
        setSelectedPocket(p);
        setLoadingTxns(true);
        try {
            const txns = await api.get<any[]>(`/pockets/${p.id}/transactions`);
            setPocketTxns(txns || []);
        } catch (err) {
            console.error('Failed to load pocket transactions', err);
            setPocketTxns([]);
        } finally {
            setLoadingTxns(false);
        }
    };

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
            setCommunityName(c.name);

            // Fetch payment config to check bank account details
            api.get<any>(`/communities/${c.id}/payment-config`)
                .then(cfg => setPaymentConfig(cfg || null))
                .catch(err => console.error('Failed to load payment config', err));

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
        if (!showTransactionModal?.pocketId || submittingTx) return;

        const amountNum = parseFloat(txForm.amount) || 0;
        if (amountNum <= 0) return;

        const pId = showTransactionModal.pocketId;
        const type = showTransactionModal.type;

        setSubmittingTx(true);
        try {
            if (type === 'disburse') {
                if (!paymentConfig || !paymentConfig.bankName || !paymentConfig.accountNumber) {
                    alert('Harap atur rekening bank komunitas terlebih dahulu di pengaturan.');
                    setSubmittingTx(false);
                    return;
                }
                await api.post(`/pockets/${pId}/withdraw`, {
                    amount: amountNum,
                    note: txForm.notes || 'Pencairan dana',
                    bankName: paymentConfig.bankName,
                    accountNumber: paymentConfig.accountNumber,
                    accountHolder: paymentConfig.accountHolder || 'Penerima'
                });
                alert('Permintaan penarikan telah diajukan dan berhasil diproses.');
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
        } finally {
            setSubmittingTx(false);
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
        PATUNGAN: (
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        IURAN: (
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
        ),
    };

    const defaultIcon = (
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );

    const typeIconWhite: Record<string, React.ReactNode> = {
        KAS: (
            <svg className="w-5 h-5 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4m0 0H9m3 0h3" />
            </svg>
        ),
        ARISAN: (
            <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        DARURAT: (
            <svg className="w-5 h-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        PATUNGAN: (
            <svg className="w-5 h-5 text-rose-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        IURAN: (
            <svg className="w-5 h-5 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
        ),
    };

    const defaultIconWhite = (
        <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    );

    const cardTheme: Record<string, { bg: string, text: string, textMuted: string, accent: string, border: string, btnPrimary: string }> = {
        KAS: {
            bg: 'from-[#0F3A4B] to-[#0A2633]',
            text: 'text-white',
            textMuted: 'text-slate-300',
            accent: 'text-amber-400',
            border: 'border-white/10',
            btnPrimary: 'bg-amber-500 text-slate-950 hover:bg-amber-400'
        },
        ARISAN: {
            bg: 'from-[#6E2E1D] to-[#511F12]',
            text: 'text-white',
            textMuted: 'text-amber-100/80',
            accent: 'text-amber-300',
            border: 'border-white/10',
            btnPrimary: 'bg-amber-400 text-slate-950 hover:bg-amber-300'
        },
        DARURAT: {
            bg: 'from-[#7F1D1D] to-[#5C1111]',
            text: 'text-white',
            textMuted: 'text-rose-200/80',
            accent: 'text-rose-300',
            border: 'border-white/10',
            btnPrimary: 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        },
        PATUNGAN: {
            bg: 'from-[#7F1D1D] to-[#5C1111]',
            text: 'text-white',
            textMuted: 'text-rose-200/80',
            accent: 'text-rose-300',
            border: 'border-white/10',
            btnPrimary: 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        },
        IURAN: {
            bg: 'from-[#115E59] to-[#042F2E]',
            text: 'text-white',
            textMuted: 'text-teal-200/80',
            accent: 'text-teal-300',
            border: 'border-white/10',
            btnPrimary: 'bg-teal-400 text-slate-950 hover:bg-teal-300'
        }
    };

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
                    const theme = cardTheme[p.type] || cardTheme.KAS;
                    return (
                        <div 
                            key={p.id} 
                            onClick={() => handleOpenDetail(p)}
                            className="relative group pt-6 cursor-pointer select-none"
                        >
                            {/* Peeking Cash & Card inside the wallet */}
                            <div className="absolute top-0 left-6 right-6 h-7 flex justify-between items-end overflow-hidden pointer-events-none z-0">
                                {/* Credit Card Corner */}
                                <div className="w-12 h-10 bg-slate-900 rounded-lg rotate-12 translate-y-3 transform shadow-sm border border-slate-700/50 flex items-center justify-center group-hover:translate-y-1 transition duration-300">
                                    <div className="w-2.5 h-1.5 bg-amber-400 rounded-sm -translate-x-1.5 -translate-y-1" />
                                </div>
                                {/* Rp 100.000 Bill Corner */}
                                <div className="w-16 h-12 bg-rose-500/95 rounded-lg -rotate-12 translate-y-3.5 transform shadow-sm border border-rose-600/30 flex items-start justify-between p-1 group-hover:translate-y-1 transition duration-300">
                                    <span className="text-[5px] text-rose-100 font-extrabold font-mono leading-none">Rp</span>
                                    <div className="w-3 h-3 rounded-full bg-rose-400 opacity-60" />
                                </div>
                                {/* Rp 50.000 Bill Corner */}
                                <div className="w-14 h-12 bg-sky-500/95 rounded-lg -rotate-6 translate-y-4 transform shadow-sm border border-sky-600/30 flex items-start justify-between p-1 group-hover:translate-y-1.5 transition duration-300">
                                    <span className="text-[5px] text-sky-100 font-extrabold font-mono leading-none">Rp</span>
                                    <div className="w-2 h-2 rounded-full bg-sky-400 opacity-60" />
                                </div>
                            </div>

                            {/* Wallet Body */}
                            <div 
                                style={p.type === 'KAS' ? {
                                    backgroundImage: 'linear-gradient(to bottom, var(--community-primary, #0F3A4B), color-mix(in srgb, var(--community-primary, #0F3A4B) 60%, #000))'
                                } : undefined}
                                className={`bg-gradient-to-b ${p.type === 'KAS' ? '' : theme.bg} rounded-2xl p-5 shadow-lg flex flex-col gap-4 relative z-10 border border-slate-950/20 group-hover:shadow-xl group-hover:brightness-105 active:scale-[0.99] transition duration-200 overflow-hidden`}
                            >
                                {/* Stitched Line border inside */}
                                <div className="absolute inset-1.5 border border-dashed border-white/20 rounded-xl pointer-events-none" />

                                {/* Metal Snap Button / Pocket Clasp */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full border border-amber-600 shadow-md flex items-center justify-center z-20">
                                    <div className="w-1.5 h-1.5 bg-amber-200 rounded-full" />
                                </div>

                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2 relative z-10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition duration-250">
                                            {typeIconWhite[p.type] ?? defaultIconWhite}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={`font-serif text-base font-bold ${theme.text} leading-tight truncate`}>{p.name}</h3>
                                            <p className={`text-[10px] ${theme.textMuted} font-semibold mt-0.5 uppercase tracking-wide truncate`}>{p.description || p.type}</p>
                                        </div>
                                    </div>
                                    {role === 'admin' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePocket(p.id);
                                            }}
                                            className="p-1.5 text-white/45 hover:text-rose-400 hover:bg-white/10 rounded-lg transition cursor-pointer flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Balance */}
                                <div className="relative z-10">
                                    <span className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-wider`}>Available Balance</span>
                                    <p className={`font-serif text-2xl font-black ${theme.accent} tracking-tight mt-0.5`}>{idr(p.balance)}</p>
                                </div>

                                {/* Whitelabel Virtual Account */}
                                <div className="relative z-10 bg-black/15 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white/80 space-y-0.5">
                                    <p className="font-bold text-white/40 uppercase tracking-widest text-[7.5px]">Virtual Account Nobu (Whitelabel)</p>
                                    <p className="font-mono font-bold tracking-wider text-[11px] text-white">{getPocketVA(p)}</p>
                                    <p className="truncate text-white/50 text-[8.5px] font-semibold">{getPocketVAName(communityName, p.name)}</p>
                                </div>

                                {/* Admin Action Buttons */}
                                {role === 'admin' && (
                                    <div className="flex flex-col gap-2 mt-auto relative z-10">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowTransactionModal({ type: 'deposit', pocketId: p.id });
                                                }}
                                                className={`py-2 ${theme.btnPrimary} rounded-xl text-xs font-bold transition cursor-pointer shadow-sm`}
                                            >Deposit</button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowTransactionModal({ type: 'expense', pocketId: p.id });
                                                }}
                                                className="py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                                            >Log Expense</button>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTxForm({ amount: String(p.balance), notes: '' });
                                                setShowTransactionModal({ type: 'disburse', pocketId: p.id });
                                            }}
                                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/25 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                        >Tarik (Disburse)</button>
                                    </div>
                                )}
                            </div>
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
                            <option value="KAS">Kas Umum</option>
                            <option value="ARISAN">Arisan</option>
                            <option value="PATUNGAN">Darurat / Sosial (Patungan)</option>
                            <option value="IURAN">Iuran Rutin</option>
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
            {showTransactionModal && (() => {
                const isDisburse = showTransactionModal.type === 'disburse';
                const hasBank = paymentConfig?.bankName && paymentConfig?.accountNumber;

                return (
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

                            {isDisburse && !hasBank ? (
                                <div className="space-y-4 text-center py-4">
                                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-800 text-sm">Rekening Bank Belum Diatur</h4>
                                        <p className="text-xs text-gray-500 px-4">
                                            Harap atur rekening bank komunitas terlebih dahulu di pengaturan untuk melakukan penarikan dana.
                                        </p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => router.push('/settings')} 
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-90 transition cursor-pointer"
                                    >
                                        Atur Rekening Sekarang
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {showTransactionModal.type === 'deposit' && (() => {
                                        const targetPocket = pockets.find(p => p.id === showTransactionModal.pocketId);
                                        if (!targetPocket) return null;
                                        return (
                                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
                                                <p className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Tujuan Transfer Virtual Account (Whitelabel Nobu):</p>
                                                <p className="font-mono font-bold text-slate-800 text-sm tracking-wider">{getPocketVA(targetPocket)}</p>
                                                <p className="font-semibold text-slate-700 text-[10px]">{getPocketVAName(communityName, targetPocket.name)}</p>
                                                <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1">Sistem whitelabel auto-routing akan langsung menyalurkan dana Anda ke pocket ini.</p>
                                            </div>
                                        );
                                    })()}

                                    {isDisburse && hasBank && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                                            <p className="font-bold text-slate-700">Tujuan Transfer Bank Komunitas:</p>
                                            <p className="font-semibold text-slate-800">{paymentConfig.bankName} - {paymentConfig.accountNumber}</p>
                                            <p>A/N {paymentConfig.accountHolder}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nominal Rupiah</label>
                                        <input
                                            type="number" required value={txForm.amount}
                                            onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                                            placeholder="Jumlah Rupiah"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary font-mono text-slate-800 font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keterangan / Catatan</label>
                                        <input
                                            type="text" value={txForm.notes}
                                            onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                                            placeholder="Catatan Transaksi"
                                            className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button 
                                            type="button" 
                                            disabled={submittingTx}
                                            onClick={() => setShowTransactionModal(null)} 
                                            className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-slate-600 hover:bg-gray-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >Batal</button>
                                        <button 
                                            type="submit" 
                                            disabled={submittingTx}
                                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submittingTx ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Memproses...</span>
                                                </>
                                            ) : 'Proses'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                );
            })()}

            {/* ── Modal: Detail Kantong & Riwayat Transaksi ── */}
            {selectedPocket && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-6 max-h-[85vh] sm:max-h-[80vh] flex flex-col">
                        
                        {/* Header Detail */}
                        <div className="flex items-start justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center">
                                    {typeIcon[selectedPocket.type] ?? defaultIcon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-serif text-lg font-bold text-slate-800 leading-tight">{selectedPocket.name}</h3>
                                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            selectedPocket.type === 'KAS' ? 'bg-sky-50 text-sky-700' :
                                            selectedPocket.type === 'ARISAN' ? 'bg-indigo-50 text-indigo-700' :
                                            'bg-rose-50 text-rose-700'
                                        }`}>
                                            {selectedPocket.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-semibold mt-1">{selectedPocket.description || 'Tidak ada deskripsi.'}</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setSelectedPocket(null)} 
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Balance Card */}
                        <div className="bg-[#0B1E26]/5 border border-slate-200/50 rounded-2xl p-5 flex flex-col justify-between flex-shrink-0">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Dana Terkumpul</span>
                                <p className="font-serif text-3xl font-black text-[#0B1E26] tracking-tight mt-1">{idr(selectedPocket.balance)}</p>
                            </div>
                        </div>

                        {/* Whitelabel Bank Routing Card */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2 flex-shrink-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Virtual Account Khusus Kantong (Whitelabel Nobu)</span>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-mono text-sm font-black text-slate-800 tracking-wider">{getPocketVA(selectedPocket)}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{getPocketVAName(communityName, selectedPocket.name)}</p>
                                </div>
                                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100 uppercase tracking-wider">Nobu Route</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">
                                Setiap dana yang ditransfer ke VA ini akan otomatis didepositkan langsung ke kantong <strong>{selectedPocket.name}</strong>.
                            </p>
                        </div>

                        {/* Transactions Section */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h4 className="font-serif text-sm font-bold text-slate-800 tracking-tight pb-3 border-b border-gray-100 flex-shrink-0">Riwayat Catatan Kas</h4>
                            
                            <div className="flex-1 overflow-y-auto pt-3 divide-y divide-gray-50 pr-1">
                                {loadingTxns ? (
                                    <div className="py-10 text-center text-xs text-gray-400 font-medium animate-pulse">Memuat riwayat transaksi...</div>
                                ) : pocketTxns.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-gray-400 font-medium">Belum ada riwayat transaksi pada kantong ini.</div>
                                ) : (
                                    pocketTxns.map((tx) => {
                                        const isIn = tx.direction === 'in';
                                        return (
                                            <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                                        {isIn ? (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">{tx.note || 'Pencatatan Tanpa Keterangan'}</p>
                                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                            Oleh {tx.createdBy?.name || 'Sistem'} • {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-xs font-extrabold ${isIn ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                        {isIn ? '+' : '-'} {idr(Number(tx.amount))}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
