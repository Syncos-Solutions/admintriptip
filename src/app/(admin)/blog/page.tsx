'use client';
// src/app/(admin)/blog/page.tsx

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Eye, Edit3, Archive } from 'lucide-react';
import {
  PageHeader, Badge, FilterBar, Pagination,
  EmptyState, PageLoader, ConfirmDialog, Button,
} from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { BlogPost, BlogStatus } from '@/types';

const PAGE_SIZE = 15;
const STATUS_COLOR: Record<BlogStatus, string> = {
  draft:     'bg-gray-100 text-gray-600 border border-gray-200',
  published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  archived:  'bg-orange-50 text-orange-700 border border-orange-200',
};

export default function BlogListPage() {
  const [posts,     setPosts]     = useState<BlogPost[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();
    let q = sb.from('blog_posts')
      .select('id,slug,title,category,status,featured,author,published_at,view_count,created_at,updated_at', { count: 'exact' });
    if (status) q = q.eq('status', status);
    if (search) q = q.or(`title.ilike.%${search}%,slug.ilike.%${search}%,category.ilike.%${search}%`);
    const { data, count } = await q.order('updated_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setPosts((data as BlogPost[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { load(); }, [load]);

  const doArchive = async () => {
    if (!archiveId) return;
    setArchiving(true);
    await getSupabaseClient().from('blog_posts').update({ status: 'archived' }).eq('id', archiveId);
    setArchiveId(null); setArchiving(false); load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Blog Posts" subtitle={`${total} articles`}
        actions={<Link href="/blog/new"><Button size="sm"><Plus size={13} /> New Post</Button></Link>} />

      <FilterBar>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title, slug…" className="admin-input pl-8 w-64 text-xs" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="admin-input admin-select w-36 text-xs">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </FilterBar>

      <div className="bg-white">
        {loading ? <PageLoader /> : posts.length === 0 ? <EmptyState message="No blog posts found." /> : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead><tr>
                <th className="text-left">Title</th><th className="text-left">Category</th>
                <th className="text-left">Status</th><th className="text-left">Published</th>
                <th className="text-left">Views</th><th className="text-left">Updated</th><th />
              </tr></thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.featured && <span className="text-[9px] font-bold px-1.5 py-0.5 text-amber-700 bg-amber-50 border border-amber-200">★</span>}
                        <div>
                          <p className="text-xs font-semibold text-[#111] max-w-[280px] truncate">{p.title}</p>
                          <p className="text-[10px] text-[#888] font-mono">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[#555]">{p.category}</td>
                    <td><Badge label={p.status} className={STATUS_COLOR[p.status]} /></td>
                    <td className="text-xs text-[#888]">{formatDate(p.published_at)}</td>
                    <td className="text-xs text-[#555]">{(p.view_count || 0).toLocaleString()}</td>
                    <td className="text-xs text-[#888]">{formatRelativeTime(p.updated_at)}</td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/blog/${p.id}`} className="p-1.5 text-[#888] hover:text-[#5e17eb] transition-colors" title="Edit">
                          <Edit3 size={13} />
                        </Link>
                        {p.status !== 'archived' && (
                          <button onClick={() => setArchiveId(p.id)}
                            className="p-1.5 text-[#888] hover:text-red-500 transition-colors" title="Archive">
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      <ConfirmDialog open={!!archiveId} onClose={() => setArchiveId(null)} onConfirm={doArchive}
        loading={archiving} title="Archive Post"
        message="This post will be hidden from the public site. You can restore it by editing its status."
        confirmLabel="Archive" />
    </div>
  );
}
