import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const useInteract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { articleId: string; type: 'like' | 'unlike' | 'block' | 'unblock' | 'bookmark' | 'unbookmark' }) =>
      apiFetch<{ data: { newCount?: number } }>('/api/article-interactions', { method: 'POST', body: payload }),
    onSuccess: (_, { articleId, type }) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article', articleId] });
      qc.invalidateQueries({ queryKey: ['dashboard-data'] });
      if (type === 'block') toast.success('Article blocked');
      if (type === 'unblock') toast.success('Article unblocked');
      if (type === 'like') toast.success('Article liked');
      if (type === 'unlike') toast.success('Like removed');
      if (type === 'bookmark') toast.success('Article bookmarked');
      if (type === 'unbookmark') toast.success('Bookmark removed');
    },
    onError: (error: any, variables) => {
      const messages = {
        block: 'Failed to block article',
        unblock: 'Failed to unblock article',
        like: 'Failed to like article',
        unlike: 'Failed to remove like',
        bookmark: 'Failed to bookmark article',
        unbookmark: 'Failed to remove bookmark'
      };
      const base = messages[variables?.type as keyof typeof messages] || 'Action failed';
      toast.error(error?.message || base);
    }
  });
};

export const like = (articleId: string) => ({ articleId, type: 'like' as const });
export const unlike = (articleId: string) => ({ articleId, type: 'unlike' as const });
export const block = (articleId: string) => ({ articleId, type: 'block' as const });
export const unblock = (articleId: string) => ({ articleId, type: 'unblock' as const });
export const bookmark = (articleId: string) => ({ articleId, type: 'bookmark' as const });
export const unbookmark = (articleId: string) => ({ articleId, type: 'unbookmark' as const });
