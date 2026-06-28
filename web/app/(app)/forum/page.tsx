'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Thread {
    id: string;
    title: string;
    content: string;
    upvotes: number;
    createdAt: string;
    author: { name: string; avatarUrl?: string };
    _count?: { comments: number };
}

export default function ForumPage() {
    const router = useRouter();
    const [slug, setSlug] = useState('keluarga-cemara');
    const [communityId, setCommunityId] = useState('');
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    const [showNewThreadModal, setShowNewThreadModal] = useState(false);
    const [newThreadForm, setNewThreadForm] = useState({ title: '', content: '' });

    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentBody, setNewCommentBody] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        const activeSlug = localStorage.getItem('kyklos_active_community_slug') || 'keluarga-cemara';
        setSlug(activeSlug);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const list = await api.get<any[]>('/communities');
            const c = list.find(x => x.slug === slug) || list[0];
            if (!c) {
                router.push('/login');
                return;
            }
            setCommunityId(c.id);

            const fetchedPosts = await api.get<any[]>(`/communities/${c.id}/posts`);
            const mappedThreads = (fetchedPosts || []).map(post => {
                const parts = post.body.split('\n\n');
                const title = parts[0] || 'Untitled';
                const content = parts.slice(1).join('\n\n') || post.body;
                return {
                    id: post.id,
                    title,
                    content,
                    upvotes: 0,
                    createdAt: post.createdAt,
                    author: post.author || { name: 'Unknown' },
                    _count: { comments: post._count?.comments || 0 }
                };
            });
            setThreads(mappedThreads || []);
        } catch (err) {
            console.error('Failed to load forum', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [slug, router]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/communities/${communityId}/posts`, {
                body: `${newThreadForm.title}\n\n${newThreadForm.content}`,
                isAnnouncement: false,
            });
            setShowNewThreadModal(false);
            setNewThreadForm({ title: '', content: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'Gagal membuat diskusi baru');
        }
    };

    const handleUpvote = async (id: string) => {
        // Post model doesn't support upvote in schema yet, keep it as a visual simulation or mock if needed
        try {
            await api.post(`/forum/${id}/upvote`, {});
            loadData();
        } catch (err: any) {
            // Fallback for simulation
            setThreads(prev => prev.map(t => t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t));
        }
    };

    const handleSelectThread = async (thread: Thread) => {
        setSelectedThread(thread);
        setLoadingComments(true);
        try {
            const list = await api.get<any[]>(`/posts/${thread.id}/comments`);
            setComments(list || []);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentBody.trim() || submittingComment || !selectedThread) return;
        setSubmittingComment(true);
        try {
            const newComment = await api.post<any>(`/posts/${selectedThread.id}/comments`, {
                body: newCommentBody.trim()
            });
            setComments(prev => [...prev, newComment]);
            setNewCommentBody('');
            
            // Update counts
            setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, _count: { comments: (t._count?.comments || 0) + 1 } } : t));
            setSelectedThread(prev => prev ? { ...prev, _count: { comments: (prev._count?.comments || 0) + 1 } } : null);
        } catch (err: any) {
            alert(err.message || 'Gagal mengirim komentar.');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (selectedThread) {
        return (
            <div className="space-y-6 relative animate-fade-in text-left">
                {/* Back button */}
                <button 
                    onClick={() => setSelectedThread(null)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Discussions
                </button>

                {/* Main Thread Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 text-slate-500" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => handleUpvote(selectedThread.id)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className="text-xs font-bold">{selectedThread.upvotes}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                            <h2 className="font-serif text-2xl font-black text-slate-800 leading-tight">{selectedThread.title}</h2>
                            <div className="flex items-center gap-3">
                                {selectedThread.author?.avatarUrl ? (
                                    <img
                                        src={selectedThread.author.avatarUrl}
                                        alt={selectedThread.author.name}
                                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-500 shadow-inner">
                                        {selectedThread.author?.name?.[0]?.toUpperCase() ?? 'U'}
                                    </div>
                                )}
                                <div className="text-[11px] text-slate-500 font-medium">
                                    <span className="font-bold text-slate-700 block">{selectedThread.author?.name || 'Unknown'}</span>
                                    <span>Posted on {new Date(selectedThread.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-2">{selectedThread.content}</p>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-4 pt-4">
                    <h3 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Tanggapan ({comments.length})
                    </h3>

                    {/* New Comment Input Form */}
                    <form onSubmit={handleAddComment} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
                        <textarea
                            required
                            value={newCommentBody}
                            disabled={submittingComment}
                            onChange={e => setNewCommentBody(e.target.value)}
                            placeholder="Tulis tanggapan Anda..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none transition"
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submittingComment || !newCommentBody.trim()}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {submittingComment ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Mengirim...</span>
                                    </>
                                ) : 'Kirim Tanggapan'}
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3">
                        {loadingComments ? (
                            <div className="py-8 text-center text-xs text-gray-400">Memuat komentar...</div>
                        ) : comments.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-slate-400 text-xs font-medium">
                                Belum ada komentar. Jadilah yang pertama memberikan tanggapan!
                            </div>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm flex gap-3 animate-fade-in">
                                    <div className="flex-shrink-0">
                                        {c.author?.avatarUrl ? (
                                            <img
                                                src={c.author.avatarUrl}
                                                alt={c.author.name}
                                                className="w-8 h-8 rounded-full object-cover shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-bold text-xs flex items-center justify-center text-slate-500 shadow-inner">
                                                {c.author?.name?.[0]?.toUpperCase() ?? 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700">{c.author?.name || 'Unknown'}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-black text-slate-800 tracking-tight">Community Forum</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">Discuss ideas, ask questions, and connect with other members.</p>
                </div>

                <button 
                    onClick={() => setShowNewThreadModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-90 hover:shadow-md transition shadow-sm cursor-pointer"
                >
                    Start Discussion
                </button>
            </div>

            <div className="space-y-4 pt-2">
                {loading && <div className="py-8 text-center text-xs text-gray-400">Loading threads...</div>}
                
                {!loading && threads.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm">
                        Belum ada diskusi di komunitas ini. Jadilah yang pertama!
                    </div>
                )}

                {threads.map(thread => (
                    <div 
                        key={thread.id} 
                        onClick={() => handleSelectThread(thread)}
                        className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm flex gap-4 transition hover:border-slate-350 hover:shadow-md cursor-pointer group"
                    >
                        <div className="flex flex-col items-center gap-1 text-slate-500" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => handleUpvote(thread.id)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <span className="text-xs font-bold">{thread.upvotes}</span>
                        </div>
                        <div className="flex-shrink-0">
                            {thread.author?.avatarUrl ? (
                                <img
                                    src={thread.author.avatarUrl}
                                    alt={thread.author.name}
                                    className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 font-bold text-xs flex items-center justify-center text-slate-500 flex-shrink-0 shadow-inner">
                                    {thread.author?.name?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 font-sans">
                            <h3 className="font-serif text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition">{thread.title}</h3>
                            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5 font-medium">
                                Posted by 
                                <span className="font-bold text-slate-700">{thread.author?.name || 'Unknown'}</span> 
                                • {new Date(thread.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{thread.content}</p>
                            <div className="mt-4 flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    {thread._count?.comments || 0} Comments
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showNewThreadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <form onSubmit={handleCreateThread} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <h3 className="font-serif text-lg font-bold">Start a New Discussion</h3>
                        <input 
                            type="text" required value={newThreadForm.title}
                            onChange={e => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                            placeholder="Discussion Title"
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                        <textarea 
                            required value={newThreadForm.content}
                            onChange={e => setNewThreadForm({ ...newThreadForm, content: e.target.value })}
                            placeholder="What's on your mind?"
                            rows={5}
                            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                        />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowNewThreadModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm">Post Discussion</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}


