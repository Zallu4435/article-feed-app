import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ArticlePayload } from '@/types';
import { toast } from 'react-hot-toast';

export const useArticles = (params: { page?: number; limit?: number; categoryId?: string; search?: string; excludeBlocked?: boolean; owner?: 'me' | 'all'; enabled?: boolean } = {}) => {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: ['articles', queryParams],
    queryFn: () => apiFetch<{ articles: any[]; pagination: any }>(`/api/articles`, { query: queryParams }),
    enabled: enabled !== undefined ? enabled : true,
  });
};

export const useArticle = (id?: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => apiFetch<{ article: any }>(`/api/articles/${id}`),
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ArticlePayload) => apiFetch(`/api/articles`, { method: 'POST', body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useUpdateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ArticlePayload> }) => apiFetch(`/api/articles/${id}`, { method: 'PUT', body: payload }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['article', id] });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useDeleteArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/articles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete article');
    },
  });
};
