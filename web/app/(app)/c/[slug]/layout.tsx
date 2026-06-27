'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Community { id: string; name: string; slug: string; themeColor: string; logoUrl?: string }

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);

  useEffect(() => {
    // Fetch by slug: first get all communities, find this slug
    api.get<Community[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) { router.push('/'); return; }
      setCommunity(c);
      // Set CSS variable for whitelabel theming
      document.documentElement.style.setProperty('--community-primary', c.themeColor);
    }).catch(() => router.push('/login'));
  }, [slug, router]);

  if (!community) return <div className="flex items-center justify-center min-h-screen text-gray-400">Memuat...</div>;

  const nav = [
    { href: `/c/${slug}`, label: 'Beranda' },
    { href: `/c/${slug}/wallet`, label: 'Dompet' },
    { href: `/c/${slug}/arisan`, label: 'Arisan' },
    { href: `/c/${slug}/forum`, label: 'Forum' },
    { href: `/c/${slug}/events`, label: 'Acara' },
    { href: `/c/${slug}/members`, label: 'Anggota' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: community.themeColor }}>
            {community.name[0]}
          </div>
          <span className="font-semibold truncate flex-1">{community.name}</span>
          <Link href="/" className="text-sm text-gray-400">←</Link>
        </div>
        {/* Nav tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className="whitespace-nowrap px-3 py-1.5 text-sm rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition">
              {n.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4">
        {children}
      </div>
    </div>
  );
}
