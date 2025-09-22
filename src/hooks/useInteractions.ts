import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const useInteract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { articleId: string; type: 'like' | 'dislike' | 'block' | 'unblock' | 'bookmark' | 'unbookmark' }) =>
      apiFetch('/api/article-interactions', { method: 'POST', body: payload }),
    onSuccess: (_, { articleId, type }) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article', articleId] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (type === 'block') toast.success('Article blocked');
      if (type === 'unblock') toast.success('Article unblocked');
    },
    onError: (error: any, variables) => {
      const base = variables?.type === 'block' ? 'Failed to block article' : variables?.type === 'unblock' ? 'Failed to unblock article' : 'Action failed';
      toast.error(error?.message || base);
    }
  });
};

export const like = (articleId: string) => ({ articleId, type: 'like' as const });
export const dislike = (articleId: string) => ({ articleId, type: 'dislike' as const });
export const block = (articleId: string) => ({ articleId, type: 'block' as const });
export const unblock = (articleId: string) => ({ articleId, type: 'unblock' as const });
export const bookmark = (articleId: string) => ({ articleId, type: 'bookmark' as const });
export const unbookmark = (articleId: string) => ({ articleId, type: 'unbookmark' as const });
