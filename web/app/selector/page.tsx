'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
    description?: string;
    memberships?: Array<{ role: string }>;
}

export default function SelectorPage() {
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Hapus active slug lama agar tidak ada residu
        localStorage.removeItem('kyklos_active_community_slug');

        api.get<Community[]>('/communities')
            .then(list => {
                setCommunities(list || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setErrorMsg('Gagal memuat daftar komunitas.');
                setLoading(false);
            });
    }, []);

    const handleSelect = (slug: string) => {
        localStorage.setItem('kyklos_active_community_slug', slug);
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-[#0F3A4B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-semibold text-slate-500">Memuat komunitas...</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12 relative overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
            }}
        >
            <div className="w-full max-w-4xl z-10 space-y-10">
                <div className="text-center space-y-3">
                    <h1 className="font-serif text-3xl md:text-4xl font-black text-[#0F3A4B] tracking-tight">
                        Pilih Komunitas
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto">
                        Pilih komunitas yang ingin Anda masuki, atau buat komunitas baru untuk memulai pengelolaan finansial transparan Anda.
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold p-4 rounded-xl text-center">
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communities.map(c => {
                        const role = c.memberships?.[0]?.role || 'member';
                        return (
                        <div 
                            key={c.id} 
                            onClick={() => handleSelect(c.slug)}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-6 group h-full"
                        >
                            <div className="flex items-start justify-between">
                                <div 
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: c.themeColor || '#0B1E26' }}
                                >
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${role === 'admin' ? 'bg-[#0F3A4B]/10 text-[#0F3A4B]' : 'bg-slate-100 text-slate-500'}`}>
                                    {role === 'admin' ? 'Admin' : 'Member'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-xl text-slate-800 tracking-tight leading-tight group-hover:text-[#0F3A4B] transition-colors">{c.name}</h3>
                                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                    {c.description || 'Komunitas terkelola dengan sistem transparansi Kyklos.'}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F3A4B]">
                                <span>Masuk ke Dasbor</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    )})}
                    
                    <div 
                        onClick={() => alert('Fitur buat komunitas baru saat ini sedang dalam pengembangan.')}
                        className="bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-2xl p-6 hover:bg-slate-100 hover:border-[#0F3A4B]/50 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 text-center min-h-[220px] group"
                    >
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 group-hover:text-[#0F3A4B] group-hover:border-[#0F3A4B]/30 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 group-hover:text-[#0F3A4B] transition-colors">Buat Komunitas Baru</h3>
                            <p className="text-xs text-slate-400 mt-1.5 max-w-[200px]">Mulai komunitas Anda dan atur keanggotaan sekarang.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('kyklos_token');
                            router.push('/login');
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Bukan Anda? Keluar dari akun.
                    </button>
                </div>
            </div>
        </div>
    );
}
