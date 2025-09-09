import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiFetch('/api/users/change-password', { method: 'POST', body: payload }),
  });
};
