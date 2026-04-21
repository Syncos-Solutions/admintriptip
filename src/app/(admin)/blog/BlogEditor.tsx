'use client';
// src/app/(admin)/blog/BlogEditor.tsx
// Full blog post editor: metadata + block builder + gallery manager + publish controls.

import { useEffect, useState, useCallback } from 'react';
import { useRouter }                        from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Globe, Eye, EyeOff } from 'lucide-react';
import Link                                 from 'next/link';
import { PageHeader, Card, SectionLabel, Button, Input, Textarea, Select, PageLoader } from '@/components/ui';
import { getSupabaseClient }                from '@/lib/supabase-client';
import type { BlogPost, ContentBlock }      from '@/types';

interface Props {
  mode:     'new' | 'edit';
  postId?:  string;
}

const CATEGORIES = [
  'Culture', 'Adventure', 'Food & Culture', 'Wildlife',
  'Lifestyle', 'Tea Country', 'Heritage',
];

const BLOCK_TYPES = [
  { value: 'lead_paragraph',  label: 'Lead Paragraph (large opening)' },
  { value: 'paragraph',       label: 'Paragraph'                      },
  { value: 'heading',         label: 'Section Heading'                },
  { value: 'subheading',      label: 'Sub-heading'                    },
  { value: 'pull_quote',      label: 'Pull Quote'                     },
  { value: 'image',           label: 'Single Image'                   },
  { value: 'image_gallery',   label: 'Image Gallery'                  },
  { value: 'tips_list',       label: 'Tips List'                      },
  { value: 'divider',         label: 'Divider'                        },
];

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Block editor for a single block ───────────────────────────
function BlockEditor({
  block, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast,
}: {
  block:      ContentBlock;
  index:      number;
  onChange:   (b: ContentBlock) => void;
  onDelete:   () => void;
  onMoveUp:   () => void;
  onMoveDown: () => void;
  isFirst:    boolean;
  isLast:     boolean;
}) {
  const labelMap: Record<string, string> = {
    lead_paragraph: 'Lead Paragraph', paragraph: 'Paragraph',
    heading: 'Section Heading', subheading: 'Sub-heading',
    pull_quote: 'Pull Quote', image: 'Image', image_gallery: 'Image Gallery',
    tips_list: 'Tips List', divider: 'Divider',
  };

  return (
    <div className="border border-[#E8E4DF] bg-white group">
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F7F6] border-b border-[#E8E4DF]">
        <div className="flex items-center gap-2">
          <GripVertical size={13} className="text-[#BBB]" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#888]">
            {labelMap[block.type] || block.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp}   disabled={isFirst} className="p-1 text-[#BBB] hover:text-[#111] disabled:opacity-30">↑</button>
          <button onClick={onMoveDown} disabled={isLast}  className="p-1 text-[#BBB] hover:text-[#111] disabled:opacity-30">↓</button>
          <button onClick={onDelete} className="p-1 text-[#BBB] hover:text-red-500 transition-colors ml-1">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Block fields */}
      <div className="p-4 space-y-3">
        {/* Text blocks */}
        {['lead_paragraph', 'paragraph', 'heading', 'subheading', 'pull_quote'].includes(block.type) && (
          <textarea
            value={block.text || ''}
            onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder={`${labelMap[block.type]} text…`}
            className="admin-input admin-textarea w-full text-sm"
            rows={block.type === 'lead_paragraph' || block.type === 'paragraph' ? 4 : 2}
          />
        )}

        {/* Single image */}
        {block.type === 'image' && (
          <>
            <Input label="Image URL" value={block.src || ''} placeholder="https://…"
              onChange={e => onChange({ ...block, src: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Alt Text" value={block.alt || ''}
                onChange={e => onChange({ ...block, alt: e.target.value })} />
              <Input label="Caption (optional)" value={block.caption || ''}
                onChange={e => onChange({ ...block, caption: e.target.value })} />
            </div>
          </>
        )}

        {/* Image gallery */}
        {block.type === 'image_gallery' && (
          <>
            <Input label="Gallery Caption" value={block.caption || ''}
              onChange={e => onChange({ ...block, caption: e.target.value })} />
            {(block.images || []).map((img, i) => (
              <div key={i} className="flex items-start gap-3 border border-[#F0EDE9] p-3">
                <span className="text-[10px] font-bold text-[#888] mt-2 w-4 flex-shrink-0">{i+1}</span>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input placeholder="Image URL" value={img.src} className="admin-input text-xs col-span-3"
                    onChange={e => {
                      const imgs = [...(block.images || [])];
                      imgs[i] = { ...imgs[i], src: e.target.value };
                      onChange({ ...block, images: imgs });
                    }} />
                  <input placeholder="Alt text" value={img.alt || ''} className="admin-input text-xs"
                    onChange={e => {
                      const imgs = [...(block.images || [])];
                      imgs[i] = { ...imgs[i], alt: e.target.value };
                      onChange({ ...block, images: imgs });
                    }} />
                  <input placeholder="Caption" value={img.caption || ''} className="admin-input text-xs col-span-2"
                    onChange={e => {
                      const imgs = [...(block.images || [])];
                      imgs[i] = { ...imgs[i], caption: e.target.value };
                      onChange({ ...block, images: imgs });
                    }} />
                </div>
                <button onClick={() => {
                  const imgs = (block.images || []).filter((_, j) => j !== i);
                  onChange({ ...block, images: imgs });
                }} className="p-1 text-[#BBB] hover:text-red-500 mt-1">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ ...block, images: [...(block.images || []), { src:'', alt:'', caption:'' }] })}
              className="text-xs text-[#5e17eb] hover:underline flex items-center gap-1.5"
            >
              <Plus size={11} /> Add Image
            </button>
          </>
        )}

        {/* Tips list */}
        {block.type === 'tips_list' && (
          <>
            <Input label="Heading" value={block.heading || ''}
              onChange={e => onChange({ ...block, heading: e.target.value })} />
            {(block.items || []).map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item} placeholder={`Tip ${i + 1}…`} className="admin-input text-xs flex-1"
                  onChange={e => {
                    const items = [...(block.items || [])];
                    items[i] = e.target.value;
                    onChange({ ...block, items });
                  }} />
                <button onClick={() => {
                  const items = (block.items || []).filter((_, j) => j !== i);
                  onChange({ ...block, items });
                }} className="p-1.5 text-[#BBB] hover:text-red-500">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <button onClick={() => onChange({ ...block, items: [...(block.items || []), ''] })}
              className="text-xs text-[#5e17eb] hover:underline flex items-center gap-1.5">
              <Plus size={11} /> Add Tip
            </button>
          </>
        )}

        {block.type === 'divider' && (
          <p className="text-xs text-[#BBB] text-center py-2">— Divider —</p>
        )}
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────
export default function BlogEditor({ mode, postId }: Props) {
  const router  = useRouter();
  const [loading, setLoading]   = useState(mode === 'edit');
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);

  // Meta fields
  const [title,       setTitle]       = useState('');
  const [slug,        setSlug]        = useState('');
  const [slugEdited,  setSlugEdited]  = useState(false);
  const [subtitle,    setSubtitle]    = useState('');
  const [excerpt,     setExcerpt]     = useState('');
  const [category,    setCategory]    = useState(CATEGORIES[0]);
  const [readTime,    setReadTime]    = useState('5 min read');
  const [featured,    setFeatured]    = useState(false);
  const [status,      setStatus]      = useState<'draft'|'published'|'archived'>('draft');
  const [heroImage,   setHeroImage]   = useState('');
  const [heroAlt,     setHeroAlt]     = useState('');
  const [author,      setAuthor]      = useState('');
  const [authorRole,  setAuthorRole]  = useState('');
  const [authorBio,   setAuthorBio]   = useState('');
  const [authorInit,  setAuthorInit]  = useState('');
  const [tags,        setTags]        = useState('');
  const [metaTitle,   setMetaTitle]   = useState('');
  const [metaDesc,    setMetaDesc]    = useState('');
  const [blocks,      setBlocks]      = useState<ContentBlock[]>([]);
  const [gallery,     setGallery]     = useState<{ src:string; alt:string; caption?:string }[]>([]);
  const [newBlockType, setNewBlockType] = useState('paragraph');

  // Auto-slug from title
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title));
  }, [title, slugEdited]);

  // Auto author initials
  useEffect(() => {
    const parts = author.trim().split(' ');
    setAuthorInit(parts.map(p => p[0] || '').join('').toUpperCase().slice(0, 2));
  }, [author]);

  // Load existing post
  useEffect(() => {
    if (mode !== 'edit' || !postId) return;
    (async () => {
      const { data } = await getSupabaseClient()
        .from('blog_posts').select('*').eq('id', postId).single();
      if (!data) { router.push('/blog'); return; }
      const p = data as BlogPost;
      setTitle(p.title); setSlug(p.slug); setSlugEdited(true);
      setSubtitle(p.subtitle || ''); setExcerpt(p.excerpt);
      setCategory(p.category); setReadTime(p.read_time);
      setFeatured(p.featured); setStatus(p.status);
      setHeroImage(p.hero_image); setHeroAlt(p.hero_image_alt || '');
      setAuthor(p.author); setAuthorRole(p.author_role || '');
      setAuthorBio(p.author_bio || ''); setAuthorInit(p.author_initials || '');
      setTags((p.tags || []).join(', '));
      setMetaTitle(p.meta_title || ''); setMetaDesc(p.meta_description || '');
      setBlocks(p.body_content || []);
      setGallery(p.gallery_images || []);
      setLoading(false);
    })();
  }, [mode, postId, router]);

  const addBlock = () => {
    const empty: ContentBlock = { type: newBlockType };
    if (newBlockType === 'image_gallery') empty.images = [];
    if (newBlockType === 'tips_list')     empty.items  = [];
    setBlocks(b => [...b, empty]);
  };

  const updateBlock = (i: number, b: ContentBlock) => {
    setBlocks(prev => prev.map((x, j) => j === i ? b : x));
  };

  const deleteBlock = (i: number) => {
    setBlocks(prev => prev.filter((_, j) => j !== i));
  };

  const moveBlock = (i: number, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const arr = [...prev];
      const swap = dir === 'up' ? i - 1 : i + 1;
      if (swap < 0 || swap >= arr.length) return arr;
      [arr[i], arr[swap]] = [arr[swap], arr[i]];
      return arr;
    });
  };

  const save = async (newStatus?: 'draft' | 'published' | 'archived') => {
    setSaving(true);
    const sb     = getSupabaseClient();
    const saveStatus = newStatus || status;

    const payload = {
      title, slug, subtitle: subtitle || null, excerpt, category,
      read_time:          readTime,
      featured,
      status:             saveStatus,
      hero_image:         heroImage,
      hero_image_alt:     heroAlt || null,
      author,
      author_role:        authorRole || null,
      author_bio:         authorBio || null,
      author_initials:    authorInit || null,
      tags:               tags.split(',').map(t => t.trim()).filter(Boolean),
      meta_title:         metaTitle || null,
      meta_description:   metaDesc || null,
      body_content:       blocks,
      gallery_images:     gallery,
      related_slugs:      [],
      published_at:       saveStatus === 'published' ? new Date().toISOString() : null,
      updated_at:         new Date().toISOString(),
    };

    if (mode === 'new') {
      const { data, error } = await sb.from('blog_posts')
        .insert({ ...payload, view_count: 0, created_at: new Date().toISOString() })
        .select('id').single();
      if (data) router.push(`/blog/${data.id}`);
      if (error) console.error('[BLOG SAVE] Insert error:', error);
    } else {
      await sb.from('blog_posts').update(payload).eq('id', postId);
      if (newStatus) setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={mode === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
        subtitle={mode === 'edit' ? slug : 'Create a new article'}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/blog">
              <Button variant="ghost" size="sm"><ArrowLeft size={13} /> Back</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => save('draft')} loading={saving}>
              <Save size={13} /> {saved ? 'Saved!' : 'Save Draft'}
            </Button>
            {status !== 'published' ? (
              <Button size="sm" onClick={() => save('published')} loading={saving}>
                <Globe size={13} /> Publish
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => save('draft')} loading={saving}>
                <EyeOff size={13} /> Unpublish
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: Blocks ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <SectionLabel>Title & Slug</SectionLabel>
            <div className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Post title…"
                className="admin-input text-base font-semibold" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888] flex-shrink-0">/blog/</span>
                <input value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugEdited(true); }}
                  placeholder="url-slug"
                  className="admin-input text-xs font-mono flex-1" />
              </div>
              <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder="Subtitle (optional)…"
                className="admin-input admin-textarea text-sm" rows={2} />
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="Excerpt shown in blog list (required)…"
                className="admin-input admin-textarea text-sm" rows={2} />
            </div>
          </Card>

          {/* Content Blocks */}
          <Card>
            <SectionLabel>Body Content ({blocks.length} blocks)</SectionLabel>
            <div className="space-y-3 mb-4">
              {blocks.length === 0 && (
                <p className="text-xs text-[#BBB] text-center py-4">No blocks yet. Add your first block below.</p>
              )}
              {blocks.map((block, i) => (
                <BlockEditor
                  key={i} block={block} index={i}
                  onChange={b => updateBlock(i, b)}
                  onDelete={() => deleteBlock(i)}
                  onMoveUp={() => moveBlock(i, 'up')}
                  onMoveDown={() => moveBlock(i, 'down')}
                  isFirst={i === 0} isLast={i === blocks.length - 1}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-[#F0EDE9] pt-4">
              <select value={newBlockType} onChange={e => setNewBlockType(e.target.value)}
                className="admin-input admin-select text-xs flex-1">
                {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <Button size="sm" onClick={addBlock}>
                <Plus size={13} /> Add Block
              </Button>
            </div>
          </Card>

          {/* Gallery */}
          <Card>
            <SectionLabel>Photo Journal Gallery ({gallery.length} images)</SectionLabel>
            <div className="space-y-3 mb-3">
              {gallery.map((img, i) => (
                <div key={i} className="flex items-start gap-3 border border-[#F0EDE9] p-3">
                  <span className="text-[10px] font-bold text-[#888] mt-2 w-4 flex-shrink-0">{i+1}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input placeholder="Image URL" value={img.src} className="admin-input text-xs col-span-3"
                      onChange={e => { const g = [...gallery]; g[i] = {...g[i], src:e.target.value}; setGallery(g); }} />
                    <input placeholder="Alt text" value={img.alt||''} className="admin-input text-xs"
                      onChange={e => { const g = [...gallery]; g[i] = {...g[i], alt:e.target.value}; setGallery(g); }} />
                    <input placeholder="Caption" value={img.caption||''} className="admin-input text-xs col-span-2"
                      onChange={e => { const g = [...gallery]; g[i] = {...g[i], caption:e.target.value}; setGallery(g); }} />
                  </div>
                  <button onClick={() => setGallery(gallery.filter((_,j)=>j!==i))}
                    className="p-1 text-[#BBB] hover:text-red-500 mt-1"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setGallery([...gallery, {src:'',alt:'',caption:''}])}
              className="text-xs text-[#5e17eb] hover:underline flex items-center gap-1.5">
              <Plus size={11} /> Add Gallery Image
            </button>
          </Card>
        </div>

        {/* ── Right: Metadata ────────────────────────────── */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <SectionLabel>Status & Settings</SectionLabel>
            <div className="space-y-3">
              <Select label="Status" value={status}
                onChange={e => setStatus(e.target.value as 'draft'|'published'|'archived')}
                options={[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'archived',label:'Archived'}]} />
              <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}
                options={CATEGORIES.map(c => ({value:c,label:c}))} />
              <Input label="Read Time" value={readTime} onChange={e => setReadTime(e.target.value)}
                placeholder="e.g. 5 min read" />
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setFeatured(f => !f)}
                  className="w-4 h-4 border flex items-center justify-center flex-shrink-0 cursor-pointer"
                  style={{
                    background: featured ? 'linear-gradient(135deg,#5e17eb,#1800ad)' : '#fff',
                    borderColor: featured ? '#5e17eb' : '#D1D5DB', borderWidth:1, borderStyle:'solid',
                  }}
                >
                  {featured && (
                    <svg viewBox="0 0 10 8" width="8" height="8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="square"/>
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[#444]" onClick={() => setFeatured(f => !f)}>
                  Featured post
                </span>
              </label>
            </div>
          </Card>

          {/* Hero image */}
          <Card>
            <SectionLabel>Hero Image</SectionLabel>
            <div className="space-y-2">
              <Input label="Image URL" value={heroImage} onChange={e => setHeroImage(e.target.value)}
                placeholder="https://…" />
              <Input label="Alt Text" value={heroAlt} onChange={e => setHeroAlt(e.target.value)}
                placeholder="Describe the image" />
              {heroImage && (
                <div className="overflow-hidden aspect-video border border-[#E8E4DF]">
                  <img src={heroImage} alt={heroAlt} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </Card>

          {/* Author */}
          <Card>
            <SectionLabel>Author</SectionLabel>
            <div className="space-y-2">
              <Input label="Name" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
              <Input label="Role" value={authorRole} onChange={e => setAuthorRole(e.target.value)} placeholder="e.g. Lead Cultural Guide" />
              <Input label="Initials (auto)" value={authorInit} onChange={e => setAuthorInit(e.target.value)} />
              <Textarea label="Bio" value={authorBio} onChange={e => setAuthorBio(e.target.value)} rows={3} />
            </div>
          </Card>

          {/* Tags & SEO */}
          <Card>
            <SectionLabel>Tags</SectionLabel>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Sigiriya, Sunrise, Wildlife…"
              className="admin-input text-xs" />
            <p className="text-[10px] text-[#888] mt-1">Comma-separated</p>
          </Card>

          <Card>
            <SectionLabel>SEO (optional)</SectionLabel>
            <div className="space-y-2">
              <Input label="Meta Title" value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                placeholder="Defaults to post title" />
              <Textarea label="Meta Description" value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)} rows={2}
                placeholder="Defaults to excerpt" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
