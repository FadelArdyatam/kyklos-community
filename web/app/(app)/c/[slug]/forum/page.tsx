'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';

interface Post { id: string; body: string; isAnnouncement: boolean; createdAt: string; author: { name: string }; _count: { comments: number } }

export default function ForumPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      return api.get<Post[]>(`/communities/${c.id}/posts`);
    }).then(p => p && setPosts(p)).catch(() => router.push('/login'));
  }, [slug, router]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    const p = await api.post<Post>(`/communities/${communityId}/posts`, { body });
    setPosts(prev => [p, ...prev]);
    setBody('');
  }

  return (
    <div className="space-y-3">
      <form onSubmit={post} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <textarea required rows={2} placeholder="Tulis sesuatu..." value={body} onChange={e => setBody(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Posting</button>
      </form>
      {posts.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Belum ada postingan</p>}
      {posts.map(p => (
        <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-4 ${p.isAnnouncement ? 'border-l-4 border-indigo-500' : ''}`}>
          {p.isAnnouncement && <span className="text-xs font-semibold text-indigo-600 mb-1 block">📢 Pengumuman</span>}
          <p className="text-sm">{p.body}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <span>{p.author.name}</span>
            <span>·</span>
            <span>{relativeTime(p.createdAt)}</span>
            <span>·</span>
            <span>{p._count.comments} komentar</span>
          </div>
        </div>
      ))}
    </div>
  );
}
