'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getMe, logout } from '@/lib/auth';

interface Community {
    id: string;
    name: string;
    slug: string;
    themeColor: string;
    logoUrl?: string;
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const pathname = usePathname();
    const [community, setCommunity] = useState<Community | null>(null);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        // Ambil data me/auth untuk sidebar profile
        getMe().then(u => {
            if (u) setUser(u);
        });

        // Ambil data komunitas berdasarkan slug
        api.get<Community[]>('/communities').then(list => {
            const c = list.find(x => x.slug === slug);
            if (!c) {
                router.push('/dashboard');
                return;
            }
            setCommunity(c);
            // Simpan variabel CSS untuk theming dinamis
            document.documentElement.style.setProperty('--community-primary', c.themeColor);
        }).catch(() => router.push('/login'));
    }, [slug, router]);

    function handleLogout() {
        logout();
        router.push('/login');
    }

    if (!community) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
                Memuat komunitas...
            </div>
        );
    }

    const nav = [
        { href: `/c/${slug}`, label: 'Beranda', icon: '🏠' },
        { href: `/c/${slug}/wallet`, label: 'Dompet', icon: '💳' },
        { href: `/c/${slug}/arisan`, label: 'Arisan', icon: '🔄' },
        { href: `/c/${slug}/forum`, label: 'Forum', icon: '💬' },
        { href: `/c/${slug}/events`, label: 'Acara', icon: '📅' },
        { href: `/c/${slug}/members`, label: 'Anggota', icon: '👥' },
    ];

    // Mendapatkan label halaman aktif saat ini
    const activeNav = nav.find(n => pathname === n.href || (n.href !== `/c/${slug}` && pathname?.startsWith(n.href)));
    const activeLabel = activeNav ? activeNav.label : 'Beranda';

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Kiri - Hanya Muncul di Layar Desktop (md ke atas) (Aesthetic dari KUYY!) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200/80 h-screen sticky top-0 flex-shrink-0">
                {/* Logo Brand / Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="text-2xl font-black text-[#ff6b00] tracking-tighter">Kyklos!</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">COMMUNITY</span>
                    </Link>
                </div>

                {/* Profil Komunitas Aktif */}
                <div className="px-4 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm"
                            style={{ backgroundColor: community.themeColor }}>
                            {community.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Komunitas</p>
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{community.name}</p>
                        </div>
                    </div>
                </div>

                {/* Menu Navigasi Sidebar */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {nav.map(n => {
                        const isCurrent = pathname === n.href || (n.href !== `/c/${slug}` && pathname?.startsWith(n.href));
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    isCurrent
                                        ? 'bg-orange-50 text-[#ff6b00]'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <span className="text-base">{n.icon}</span>
                                <span>{n.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Sidebar - Profil Akun Pengguna & Tombol Keluar */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-black flex items-center justify-center text-sm shadow-inner">
                            {user?.name[0] ?? 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 truncate leading-none mb-0.5">{user?.name ?? 'Pengguna'}</p>
                            <p className="text-xs text-gray-400 truncate leading-none">{user?.email ?? 'bendahara@kyklos.org'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-center py-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl text-xs font-semibold text-gray-500 transition cursor-pointer"
                    >
                        Keluar Akun
                    </button>
                </div>
            </aside>

            {/* Konten Utama */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                {/* Header Seluler (md-hidden) - Menampilkan navigasi tab atas seperti sebelumnya */}
                <header className="sticky top-0 z-10 bg-white border-b shadow-sm md:hidden flex-shrink-0">
                    <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: community.themeColor }}>
                            {community.name[0]}
                        </div>
                        <span className="font-semibold truncate flex-1 text-gray-800">{community.name}</span>
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 font-bold">← Keluar</Link>
                    </div>
                    
                    {/* Tab Menu Horizontal di Seluler */}
                    <div className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto pb-1.5 scrollbar-hide">
                        {nav.map(n => {
                            const isCurrent = pathname === n.href || (n.href !== `/c/${slug}` && pathname?.startsWith(n.href));
                            return (
                                <Link
                                    key={n.href}
                                    href={n.href}
                                    className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                                        isCurrent
                                            ? 'bg-orange-50 text-[#ff6b00]'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                    }`}
                                >
                                    {n.label}
                                </Link>
                            );
                        })}
                    </div>
                </header>

                {/* Header Atas di Desktop (Hanya Muncul di md ke atas) */}
                <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-gray-200/60 bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-[#ff6b00] transition">Komunitas</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-bold text-gray-800">{community.name}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm font-semibold text-gray-500">{activeLabel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-600">Halo, <strong className="text-gray-800">{user?.name}</strong></span>
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ff6b00] font-bold flex items-center justify-center text-xs">
                            {user?.name[0] ?? 'U'}
                        </div>
                    </div>
                </header>

                {/* Area Konten Utama Halaman (Layout Responsive) */}
                <main className="flex-1">
                    <div className="max-w-lg mx-auto px-4 py-4 md:max-w-full md:px-8 md:py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
