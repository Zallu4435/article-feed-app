'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createArticleSchema, type CreateArticleForm } from '@/schemas/articles/create';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import type { Option } from '@/types/ui';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { useCreateArticle } from '@/hooks/useArticles';
import { AuthGuard } from '@/components/ui/AuthGuard';

const schema = createArticleSchema;
type FormData = CreateArticleForm;

import { useCategories } from '@/hooks/useUser';

const CreateArticlePage: React.FC = () => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const createArticle = useCreateArticle();

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<any>({
    resolver: yupResolver(schema) as any,
  });

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      let finalImageUrl = imageUrl;
      // If ImageUpload provided a file via onFileSelected, upload here
      // Note: ImageUpload sets preview and calls onFileSelected, not onUploaded
      // We support both flows: if imageUrl already set, skip; otherwise try to upload selected file if available
      const fileInput = (document.querySelector('input[type="file"]') as HTMLInputElement | null);
      const maybeFile = fileInput?.files?.[0] || null;
      if (!finalImageUrl && maybeFile) {
        const fd = new FormData();
        fd.append('file', maybeFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(errText || 'Failed to upload image');
        }
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url as string;
        setImageUrl(finalImageUrl);
      }

      const payload = {
        ...data,
        imageUrl: finalImageUrl,
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        status: isDraft ? 'draft' : 'published',
      };

      await createArticle.mutateAsync(payload);

      toast.success(isDraft ? 'Draft saved' : 'Article published');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const cats = useCategories();
  const categoryOptions: Option[] = (cats.data?.categories || []).map((c: any) => ({ value: c.id, label: c.name }));

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Article</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{isDraft ? 'Draft' : 'Publish'}</span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isDraft ? 'bg-gray-200' : 'bg-blue-600'}`}
              onClick={() => setIsDraft(!isDraft)}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isDraft ? 'translate-x-1' : 'translate-x-5'}`}
              />
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Title"
              placeholder="Write a compelling title"
              error={errors.title?.message as string | undefined}
              maxLength={120}
              {...register('title')}
            />

            <TextArea
              label="Description"
              placeholder="Brief summary (max 300 characters)"
              rows={3}
              error={errors.description?.message as string | undefined}
              maxLength={300}
              {...register('description')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SelectDropdown
                  label="Category"
                  value={watch('categoryId')}
                  onChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
                  options={categoryOptions}
                  searchable
                  loading={cats.isLoading}
                  helperText={!cats.isLoading && categoryOptions.length === 0 ? 'No categories found' : undefined}
                  error={errors.categoryId?.message as string | undefined}
                />
              </div>
              <div>
                <Input
                  label="Tags"
                  placeholder="e.g. ai, productivity, design"
                  helperText="Comma-separated"
                  {...register('tags')}
                />
              </div>
            </div>

            <ImageUpload label="Cover Image" onUploaded={setImageUrl} initialUrl={imageUrl} onClear={() => setImageUrl(null)} />

            <TextArea
              label="Content"
              placeholder="Write your article..."
              rows={12}
              error={errors.content?.message as string | undefined}
              {...register('content')}
            />

            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={() => history.back()}>Cancel</Button>
              <Button loading={saving} onClick={handleSubmit(onSubmit)}>
                {isDraft ? 'Save Draft' : 'Publish'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  );
};

export default CreateArticlePage;
