import React from 'react';
import type { UserAvatarProps } from '@/types/ui';
import { cn } from '@/lib/utils';

const sizes = {
  24: 'h-6 w-6 text-[10px]',
  32: 'h-8 w-8 text-xs',
  40: 'h-10 w-10 text-sm',
  48: 'h-12 w-12 text-base',
  56: 'h-14 w-14 text-lg',
  64: 'h-16 w-16 text-xl',
} as const;

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'U';
};

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name = 'User', size = 32 }) => {
  const nearest = (Object.keys(sizes) as unknown as number[])
    .map(Number)
    .sort((a, b) => Math.abs(a - size) - Math.abs(b - a))[0] as keyof typeof sizes;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 ring-1 ring-gray-200 overflow-hidden select-none',
        sizes[nearest]
      )}
      style={{ width: size, height: size }}
      aria-label={name}
      role="img"
    >
      {src ? (
        <img src={src} alt={name} className="object-cover w-full h-full" />
      ) : (
        <span className="font-medium tracking-wide">{getInitials(name)}</span>
      )}
    </div>
  );
};

export { UserAvatar };
