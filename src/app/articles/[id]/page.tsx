'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useArticle } from '@/hooks/useArticles';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ShareIcon,
  HeartIcon,
  HeartIcon as HeartSolidIcon,
  BookmarkIcon,
  BookmarkIcon as BookmarkSolidIcon,
  EyeIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useInteract } from '@/hooks/useInteractions';
import { AuthGuard } from '@/components/ui/AuthGuard';
import ShareModal from '@/components/ui/ShareModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/api';

const ArticleViewPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const interact = useInteract();
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data } = useArticle(params.id);
  const article = (data?.data?.article as any) || null;

  useEffect(() => {
    if (article) {
      setLiked(!!article.likedByCurrentUser);
      setBookmarked(!!article.bookmarkedByCurrentUser);
      setLikesCount(Number(article.likesCount || 0));
      setBookmarksCount(Number(article.bookmarksCount || 0));
    }
  }, [article]);

  useEffect(() => {
    if (!article) return;
    apiFetch('/api/article-views', {
      method: 'POST',
      body: { articleId: String(params.id) }
    }).catch(() => { });
  }, [article, params.id]);

  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current) return;
      const el = contentRef.current;
      const total = el.scrollHeight - el.clientHeight;
      const current = el.scrollTop;
      const p = Math.min(100, Math.max(0, (current / total) * 100));
      setProgress(p);
    };
    const el = contentRef.current;
    if (el) el.addEventListener('scroll', onScroll);
    return () => {
      if (el) el.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size={48} 
          text="Loading article..." 
          overlay={true}
          preventScroll={true}
          backdrop="blur"
        />
      </div>
    );
  }

  const handleLike = () => {
    const articleId = String(params.id);
    if (liked) {
      setLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      interact.mutate(
        { articleId, type: 'unlike' },
        {
          onSuccess: (data: any) => {
            setLikesCount(data.data?.newCount || 0);
          },
          onError: () => {
            setLiked(true);
            setLikesCount(prev => prev + 1);
          }
        }
      );
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
      if (disliked) {
        setDisliked(false);
      }
      interact.mutate(
        { articleId, type: 'like' },
        {
          onSuccess: (data: any) => {
            setLikesCount(data.data?.newCount || 0);
          },
          onError: () => {
            setLiked(false);
            setLikesCount(prev => Math.max(0, prev - 1));
          }
        }
      );
    }
  };

  const handleBookmark = () => {
    const articleId = String(params.id);
    if (bookmarked) {
      setBookmarked(false);
      setBookmarksCount(prev => Math.max(0, prev - 1));
      interact.mutate(
        { articleId, type: 'unbookmark' },
        {
          onSuccess: (data: any) => {
            setBookmarksCount(data.data?.newCount || 0);
          },
          onError: () => {
            setBookmarked(true);
            setBookmarksCount(prev => prev + 1);
          }
        }
      );
    } else {
      setBookmarked(true);
      setBookmarksCount(prev => prev + 1);
      interact.mutate(
        { articleId, type: 'bookmark' },
        {
          onSuccess: (data: any) => {
            setBookmarksCount(data.data?.newCount || 0);
          },
          onError: () => {
            setBookmarked(false);
            setBookmarksCount(prev => Math.max(0, prev - 1));
          }
        }
      );
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/articles/${params.id}`;
    }
    return '';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative w-full h-80 md:h-96 lg:h-[500px]">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Back button */}
          <div className="absolute top-6 left-6">
            <Link
              href="/articles"
              className="inline-flex items-center px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              ← Back to Articles
            </Link>
          </div>

          {/* Article info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 rounded-full">
                  {article.category?.name || 'Uncategorized'}
                </span>
                <span className="text-white/80 text-sm">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ''}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>
              <p className="text-lg text-white/90 max-w-3xl leading-relaxed">
                {article.description}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Article Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Author and Stats */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <UserAvatar
                        src={article.author?.profilePicture || undefined}
                        name={article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Anonymous Author'}
                        size={48}
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Anonymous Author'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <EyeIcon className="w-4 h-4" />
                            <span>{article.viewsCount || 0} views</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interaction buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLike}
                        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${liked
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {liked ? <HeartSolidIcon className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                        <span>{likesCount}</span>
                      </button>

                      <button
                        onClick={handleBookmark}
                        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bookmarked
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {bookmarked ? <BookmarkSolidIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                        <span>{bookmarksCount}</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="px-6 py-8">
                  <div
                    ref={contentRef}
                    className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-indigo-200 prose-blockquote:bg-indigo-50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Article Stats */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Views</span>
                      <span className="font-semibold text-gray-900">{article.viewsCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Likes</span>
                      <span className="font-semibold text-gray-900">{likesCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bookmarks</span>
                      <span className="font-semibold text-gray-900">{bookmarksCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category */}
              {article.category && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
                    <div className="flex items-center space-x-2">
                      <TagIcon className="w-5 h-5 text-indigo-600" />
                      <span className="text-gray-700">{article.category.name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Author Info */}
              {article.author && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Author</h3>
                    <div className="flex items-center space-x-3">
                      <UserAvatar
                        src={article.author?.profilePicture || undefined}
                        name={`${article.author.firstName} ${article.author.lastName}`}
                        size={48}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {article.author.firstName} {article.author.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{article.author.email}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>

        {/* Share Modal */}
        {article && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            article={{
              id: article.id,
              title: article.title,
              description: article.description,
              imageUrl: article.imageUrl,
            }}
            url={getShareUrl()}
          />
        )}
      </div>
    </AuthGuard>
  );
};

export default ArticleViewPage;
