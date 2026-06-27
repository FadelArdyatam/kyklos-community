'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Event { id: string; title: string; location?: string; eventDate?: string; description?: string; _count: { rsvps: number } }

export default function EventsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [communityId, setCommunityId] = useState('');

  useEffect(() => {
    api.get<any[]>('/communities').then(list => {
      const c = list.find(x => x.slug === slug);
      if (!c) return;
      setCommunityId(c.id);
      return api.get<Event[]>(`/communities/${c.id}/events`);
    }).then(e => e && setEvents(e)).catch(() => router.push('/login'));
  }, [slug, router]);

  async function rsvp(eventId: string, status: string) {
    await api.post(`/events/${eventId}/rsvp`, { status });
  }

  return (
    <div className="space-y-3">
      {events.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Belum ada acara</p>}
      {events.map(e => (
        <div key={e.id} className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold">{e.title}</p>
          {e.location && <p className="text-sm text-gray-500 mt-1">📍 {e.location}</p>}
          {e.eventDate && <p className="text-sm text-gray-500">{new Date(e.eventDate).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>}
          {e.description && <p className="text-sm text-gray-600 mt-2">{e.description}</p>}
          <div className="flex gap-2 mt-3">
            {(['yes', 'maybe', 'no'] as const).map(s => (
              <button key={s} onClick={() => rsvp(e.id, s)}
                className="flex-1 border rounded-lg py-1.5 text-xs font-medium hover:bg-gray-50 transition text-gray-600">
                {s === 'yes' ? '✓ Hadir' : s === 'maybe' ? '? Mungkin' : '✗ Tidak'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{e._count.rsvps} respons</p>
        </div>
      ))}
    </div>
  );
}
