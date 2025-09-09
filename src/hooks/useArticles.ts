import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ArticlePayload } from '@/types';

export const useArticles = (params: { page?: number; limit?: number; categoryId?: string; search?: string; excludeBlocked?: boolean } = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => apiFetch<{ articles: any[]; pagination: any }>(`/api/articles`, { query: params }),
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
    },
  });
};
