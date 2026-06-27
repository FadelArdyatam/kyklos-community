'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Member { id: string; userId: string; role: string; status: string; user: { id: string; name: string; email: string } }

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [communityId, setCommunityId] = useState('');

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      return api.get<Member[]>(`/communities/${c.id}/members`);
    }).then(m => m && setMembers(m)).catch(() => router.push('/login'));
  }, [slug, router]);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold">Anggota ({members.length})</h3>
      </div>
      <div className="divide-y">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
              {m.user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{m.user.name}</p>
              <p className="text-xs text-gray-400">{m.user.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
              {m.role === 'admin' ? 'Admin' : 'Anggota'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
