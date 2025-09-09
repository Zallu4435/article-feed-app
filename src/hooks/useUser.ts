import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<{ user: any }>(`/api/users/profile`),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<{ firstName: string; lastName: string; phone: string; dateOfBirth: string }>) =>
      apiFetch(`/api/users/profile`, { method: 'PUT', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

export const usePreferences = () => {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiFetch<{ preferences: any[] }>(`/api/users/preferences`),
  });
};

export const useAddPreference = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => apiFetch(`/api/users/preferences`, { method: 'POST', body: { categoryId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preferences'] }),
  });
};

export const useRemovePreference = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => apiFetch(`/api/users/preferences?categoryId=${categoryId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preferences'] }),
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<{ categories: any[] }>(`/api/categories`),
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) => apiFetch(`/api/categories`, { method: 'POST', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => apiFetch(`/api/users/profile`, { method: 'DELETE' }),
  });
};
