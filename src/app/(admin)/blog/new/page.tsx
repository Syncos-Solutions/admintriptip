'use client';
// src/app/(admin)/blog/new/page.tsx
// Create a new blog post with full block builder.

import BlogEditor from '../BlogEditor';

export default function NewBlogPage() {
  return <BlogEditor mode="new" />;
}
