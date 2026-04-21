'use client';
// src/app/(admin)/blog/[id]/page.tsx

import { useParams } from 'next/navigation';
import BlogEditor from '../BlogEditor';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  return <BlogEditor mode="edit" postId={id} />;
}
