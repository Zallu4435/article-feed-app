'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import type { Option } from '@/types/ui';
import { useCategories } from '@/hooks/useUser';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { useArticle, useUpdateArticle } from '@/hooks/useArticles';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/api';


const EditArticlePage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useArticle(params.id);
  const updateArticle = useUpdateArticle();
  const [initial, setInitial] = useState<any | null>(null);
  const cats = useCategories();
  const categoryOptions: Option[] = (cats.data?.categories || []).map((c: any) => ({ value: c.id, label: c.name }));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.article) return;
    const a = data.article as any;
    setInitial(a);
    setTitle(a.title || '');
    setDescription(a.description || '');
    setContent(a.content || '');
    setCategoryId(a.categoryId || '');
    setTags((a.tags || []).join(', '));
    setImageUrl(a.imageUrl || null);
  }, [data]);

  const changed = useMemo(() => {
    if (!initial) return false;
    return (
      title !== initial.title ||
      description !== initial.description ||
      content !== initial.content ||
      categoryId !== initial.categoryId ||
      (tags !== (initial.tags || []).join(', ')) ||
      imageUrl !== initial.imageUrl ||
      !!pendingFile
    );
  }, [title, description, content, categoryId, tags, imageUrl, pendingFile, initial]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (changed) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [changed]);

  const save = async () => {
    try {
      setSaving(true);
      let finalImageUrl = imageUrl;
      if (pendingFile) {
        const fd = new FormData();
        fd.append('file', pendingFile);
        const uploadData = await apiFetch<{ url: string }>(
          '/api/upload',
          { method: 'POST', body: fd }
        );
        finalImageUrl = uploadData.url as string;
        setImageUrl(finalImageUrl);
      }
      await updateArticle.mutateAsync({ id: String(params.id), payload: {
        title,
        description,
        content,
        categoryId,
        imageUrl: finalImageUrl ?? undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }});
      toast.success('Article updated');
      router.push('/articles/list');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!initial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} text="Loading article..." />
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {changed ? <span className="text-yellow-600">Unsaved changes</span> : <span>All changes saved</span>}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextArea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectDropdown
                label="Category"
                value={categoryId}
                onChange={(v) => setCategoryId(Array.isArray(v) ? v[0] : v)}
                options={categoryOptions}
                searchable
                helperText={categoryOptions.length === 0 ? 'No categories found' : undefined}
              />
              <Input label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>

            <ImageUpload label="Cover Image" onUploaded={setImageUrl} onFileSelected={setPendingFile} initialUrl={imageUrl} onClear={() => { setImageUrl(null); setPendingFile(null); }} />

            <TextArea label="Content" rows={12} value={content} onChange={(e) => setContent(e.target.value)} />

            <div className="flex items-center justify-end gap-3">
              <Link href="/articles/list">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={save} loading={saving} disabled={!changed}>Update</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  );
};

export default EditArticlePage;
