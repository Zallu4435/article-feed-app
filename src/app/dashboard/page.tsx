'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  PlusIcon, 
  EyeIcon, 
  HeartIcon, 
  BookmarkIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { useInteract, like, unlike, bookmark, unbookmark } from '@/hooks/useInteractions';
import { apiFetch } from '@/lib/api';
import { UserAvatar } from '@/components/ui/UserAvatar';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const json = await apiFetch<{
        data: {
          articles: any[];
          preferences: Array<{ id: string; categoryId: string; categoryName: string; createdAt: string; category: any }>;
          allCategories: Array<{ id: string; name: string }>;
          hasPreferences: boolean;
          message?: string;
          stats: { articlesRead: number; likesGiven: number; bookmarks: number; readingStreakDays: number };
        }
      }>('/api/dashboard');
      return json;
    },
  });

  const articles = dashboardQuery.data?.data?.articles || [];
  const preferences = dashboardQuery.data?.data?.preferences || [];
  const allCategories = dashboardQuery.data?.data?.allCategories || [];
  const hasPreferences = dashboardQuery.data?.data?.hasPreferences || false;
  const stats = dashboardQuery.data?.data?.stats;
  const isLoading = dashboardQuery.isLoading;


  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-white/80">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl">Welcome back, {user?.firstName}! 👋</CardTitle>
              <CardDescription>Here's what's happening in your world today</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  <StatTile label="Articles Read" value={stats?.articlesRead ?? '—'} color="blue" icon={<DocumentTextIcon className="h-5 w-5" />} />
                  <StatTile label="Likes Given" value={stats?.likesGiven ?? '—'} color="green" icon={<HeartIcon className="h-5 w-5" />} />
                  <StatTile label="Bookmarks" value={stats?.bookmarks ?? '—'} color="purple" icon={<BookmarkIcon className="h-5 w-5" />} />
                  <StatTile label="Reading Streak" value={(stats ? `${stats.readingStreakDays} day${(stats.readingStreakDays||0)===1?'':'s'}` : '—')} color="orange" icon={<ArrowTrendingUpIcon className="h-5 w-5" />} />
                </div>
                <div className="flex items-center gap-2 w-full mt-4">
                  <Link href="/articles/create">
                    <Button leftIcon={<PlusIcon />}>Write Article</Button>
                  </Link>
                  <Link href="/articles">
                    <Button variant="outline">Browse Articles</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Preferences Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Preferences</h2>
            <div className="flex items-center space-x-2">
              <Link href="/settings">
                <Button variant="outline" size="sm" leftIcon={<Cog6ToothIcon className="h-4 w-4" />}>
                  Manage Preferences
                </Button>
              </Link>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {hasPreferences ? (
            <div className="flex flex-wrap gap-2">
              {preferences.map((preference) => (
                <span
                  key={preference.id}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {preference.category?.name || 'Unknown'}
                </span>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Cog6ToothIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>No preferences selected.</strong> Please select your preferred categories to see personalized articles.
                  </p>
                </div>
                <div className="ml-auto">
                  <Link href="/settings">
                    <Button size="sm" variant="outline">
                      Select Preferences
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Articles Feed */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended for You</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} loading><div /></Card>
              ))}
            </div>
          ) : !hasPreferences ? (
            <EmptyState
              title="Select your preferences to see articles"
              description="Choose your preferred categories in settings to get personalized article recommendations."
              actionLabel="Go to Settings"
              onAction={() => (window.location.href = '/settings')}
            />
          ) : articles.length === 0 ? (
            <EmptyState
              title="No articles found"
              description="No articles available in your preferred categories yet. Try adding more categories or check back later."
              actionLabel="Manage Preferences"
              onAction={() => (window.location.href = '/settings')}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
};

const ArticleCard: React.FC<{
  article: any;
}> = ({ article }) => {
  const queryClient = useQueryClient();
  const interact = useInteract();
  const [liked, setLiked] = React.useState<boolean>(!!article.likedByCurrentUser);
  const [likesCount, setLikesCount] = React.useState<number>(Number(article.likesCount || 0));
  const [bookmarked, setBookmarked] = React.useState<boolean>(!!article.bookmarkedByCurrentUser);
  const [bookmarksCount, setBookmarksCount] = React.useState<number>(Number(article.bookmarksCount || 0));
  return (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div className="relative h-56 md:h-48">
      {article.imageUrl ? (
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-100" />
      )}
    </div>
    
    <CardContent className="p-5">
      <div className="flex items-center space-x-2 mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {article.category?.name ?? 'Uncategorized'}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {article.description}
      </p>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <UserAvatar 
            src={article.author?.profilePicture || undefined}
            name={article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Unknown author'}
            size={24}
          />
          <span className="text-sm font-medium text-gray-900">{article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Unknown author'}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm ${liked ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => {
              if (liked) {
                setLiked(false);
                setLikesCount((c) => Math.max(0, c - 1));
                interact.mutate(unlike(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              } else {
                setLiked(true);
                setLikesCount((c) => c + 1);
                interact.mutate(like(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              }
            }}
            title="Like"
          >
            {liked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
            <span>{likesCount}</span>
          </button>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600" title="Unique views">
            <EyeIcon className="h-4 w-4" />
            <span>{article.viewsCount ?? 0}</span>
          </div>
          <button
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm ${bookmarked ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => {
              if (bookmarked) {
                setBookmarked(false);
                setBookmarksCount((c) => Math.max(0, c - 1));
                interact.mutate(unbookmark(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              } else {
                setBookmarked(true);
                setBookmarksCount((c) => c + 1);
                interact.mutate(bookmark(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              }
            }}
            title="Bookmark"
          >
            <BookmarkIcon className="h-4 w-4" />
            <span>{bookmarksCount}</span>
          </button>
        </div>
        <Link href={`/articles/${article.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors" title="Open article">
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          <span>Open</span>
        </Link>
      </div>
    </CardContent>
  </Card>
);
}

const ArticleListItem: React.FC<{
  article: any;
}> = ({ article }) => {
  const queryClient = useQueryClient();
  const interact = useInteract();
  const [liked, setLiked] = React.useState<boolean>(!!article.likedByCurrentUser);
  const [likesCount, setLikesCount] = React.useState<number>(Number(article.likesCount || 0));
  const [bookmarked, setBookmarked] = React.useState<boolean>(!!article.bookmarkedByCurrentUser);
  const [bookmarksCount, setBookmarksCount] = React.useState<number>(Number(article.bookmarksCount || 0));
  return (
  <Card className="flex overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div className="relative w-44 md:w-48 h-32 md:h-32 flex-shrink-0">
      {article.imageUrl ? (
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-100" />
      )}
    </div>
    
    <div className="flex-1 p-5 min-w-0">
      <div className="flex items-center space-x-2 mb-2">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {article.category?.name ?? 'Uncategorized'}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        <Link href={`/articles/${article.id}`} className="hover:underline">{article.title}</Link>
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {article.description}
      </p>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <UserAvatar 
            src={article.author?.profilePicture || undefined}
            name={article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Unknown author'}
            size={24}
          />
          <span className="text-sm font-medium text-gray-900">{article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Unknown author'}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
          <button
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs ${liked ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => {
              if (liked) {
                setLiked(false);
                setLikesCount((c) => Math.max(0, c - 1));
                interact.mutate(unlike(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              } else {
                setLiked(true);
                setLikesCount((c) => c + 1);
                interact.mutate(like(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              }
            }}
            title="Like"
          >
            {liked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
            <span>{likesCount}</span>
          </button>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600" title="Unique views">
            <EyeIcon className="h-4 w-4" />
            <span>{article.viewsCount ?? 0}</span>
          </div>
          <button
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs ${bookmarked ? 'border-blue-200 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => {
              if (bookmarked) {
                setBookmarked(false);
                setBookmarksCount((c) => Math.max(0, c - 1));
                interact.mutate(unbookmark(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              } else {
                setBookmarked(true);
                setBookmarksCount((c) => c + 1);
                interact.mutate(bookmark(String(article.id)), {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
                  }
                });
              }
            }}
            title="Bookmark"
          >
            <BookmarkIcon className="h-4 w-4" />
            <span>{bookmarksCount}</span>
          </button>
        </div>
      </div>
    </div>
  </Card>
);
}

export default DashboardPage;

const StatTile: React.FC<{
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  };
  const c = colorMap[color];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <div className={`${c.text}`}>{icon}</div>
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-600">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
