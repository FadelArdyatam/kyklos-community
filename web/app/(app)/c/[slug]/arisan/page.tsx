'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Participant { id: string; hasReceived: boolean; member: { name: string; email: string } }
interface Period { id: string; roundNo: number; status: string; periodDate?: string; recipient?: { name: string } }

export default function ArisanPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [pocketId, setPocketId] = useState('');

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      return api.get<any[]>(`/communities/${c.id}/pockets`);
    }).then(pockets => {
      if (!pockets) return;
      const arisan = pockets.find((p: any) => p.type === 'arisan');
      if (!arisan) return;
      setPocketId(arisan.id);
      return Promise.all([
        api.get<Participant[]>(`/pockets/${arisan.id}/arisan/participants`),
        api.get<Period[]>(`/pockets/${arisan.id}/arisan/periods`),
      ]);
    }).then(res => {
      if (!res) return;
      const [parts, pers] = res as [Participant[], Period[]];
      setParticipants(parts);
      setPeriods(pers);
    }).catch(() => router.push('/login'));
  }, [slug, router]);

  async function draw() {
    await api.post(`/pockets/${pocketId}/arisan/draw`, {});
    const [p, per] = await Promise.all([
      api.get<Participant[]>(`/pockets/${pocketId}/arisan/participants`),
      api.get<Period[]>(`/pockets/${pocketId}/arisan/periods`),
    ]);
    setParticipants(p);
    setPeriods(per);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold mb-3">Peserta Arisan ({participants.length})</h3>
        <div className="space-y-2">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">{p.member.name[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.member.name}</p>
              </div>
              {p.hasReceived && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sudah Dapat</span>}
            </div>
          ))}
        </div>
        {pocketId && (
          <button onClick={draw} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">
            🎲 Undian Sekarang
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold mb-3">Riwayat Undian</h3>
        {periods.length === 0 && <p className="text-gray-400 text-sm">Belum ada undian</p>}
        <div className="space-y-2">
          {periods.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-1">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">{p.roundNo}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.recipient?.name ?? '-'}</p>
                <p className="text-xs text-gray-400">{p.periodDate ? new Date(p.periodDate).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'drawn' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
