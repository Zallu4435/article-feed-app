'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import type { Option } from '@/types/ui';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import { useInteract, block as blockAction, unblock as unblockAction } from '@/hooks/useInteractions';
import { AuthGuard } from '@/components/ui/AuthGuard';
import { WarningDialog } from '@/components/ui/WarningDialog';
import { useArticles, useDeleteArticle } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useUser';

const ListMyArticlesPage: React.FC = () => {
  const [view, setView] = useState<'table' | 'card'>('table'    );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ mode: 'block' | 'unblock' | 'delete'; id: string } | null>(null);
  const pageSize = 6;
  const interact = useInteract();
  const cats = useCategories();
  const [categoryId, setCategoryId] = useState<string>('all');
  const categoryOptions: Option[] = React.useMemo(() => {
    const base: Option[] = [{ value: 'all', label: 'All' }];
    const fromApi = (cats.data?.categories || []).map((c: any) => ({ value: c.id as string, label: c.name as string }));
    return [...base, ...fromApi];
  }, [cats.data]);

  const articlesQuery = useArticles({ page, limit: pageSize, search: debouncedSearch || undefined, categoryId: categoryId === 'all' ? undefined : categoryId, excludeBlocked: false });
  const articles = articlesQuery.data?.articles || [];
  const totalPages = Math.max(1, Number(articlesQuery.data?.pagination?.totalPages || 1));
  const isLoading = articlesQuery.isLoading;

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [search]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Reset to first page when category filter changes
  useEffect(() => {
    setPage(1);
  }, [categoryId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === articles.length) setSelected([]);
    else setSelected(articles.map((a: any) => a.id));
  };

  const bulkDelete = () => {
    alert(`Bulk delete not implemented yet`);
    setSelected([]);
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
            <p className="text-sm text-gray-600 mt-1">
              {articlesQuery.data?.pagination?.total || 0} total • {selected.length} selected
            </p>
          </div>
          <Link href="/articles/create">
            <Button>New Article</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-72">
                  <Input
                    placeholder="Search by title..."
                    leftIcon={<MagnifyingGlassIcon />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="w-64">
                  <SelectDropdown
                    value={categoryId}
                    onChange={(v) => setCategoryId(Array.isArray(v) ? v[0] : v)}
                    options={categoryOptions}
                    searchable
                    loading={cats.isLoading}
                  />
                </div>
                <div className="inline-flex items-center gap-2" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'table' ? 'secondary' : 'outline'}
                  onClick={() => setView('table')}
                  leftIcon={<Bars3Icon />}
                  size="sm"
                >
                  Table
                </Button>
                <Button
                  variant={view === 'card' ? 'secondary' : 'outline'}
                  onClick={() => setView('card')}
                  leftIcon={<Squares2X2Icon />}
                  size="sm"
                >
                  Cards
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : articles.length === 0 ? (
              (debouncedSearch || categoryId !== 'all') ? (
                <EmptyState
                  title="No articles found"
                  description="Try a different keyword or clear filters."
                  actionLabel="Clear filters"
                  onAction={() => { setSearch(''); setCategoryId('all'); }}
                />
              ) : (
                <EmptyState
                  title="No articles yet"
                  description="Create your first article to get started."
                  actionLabel="Create Article"
                  onAction={() => (window.location.href = '/articles/create')}
                />
              )
            ) : view === 'table' ? (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" onChange={toggleAll} checked={selected.length === articles.length && articles.length > 0} />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {articles.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{a.title}</div>
                          <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{a.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link href={`/articles/${a.id}`} className="text-gray-500 hover:text-gray-700">
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            <Link href={`/articles/edit/${a.id}`} className="text-blue-600 hover:text-blue-700">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Link>
                            {a.isBlocked ? (
                              <button className="text-emerald-600 hover:text-emerald-700" title="Unblock"
                                onClick={() => setConfirm({ mode: 'unblock', id: a.id })}
                              >
                                <NoSymbolIcon className="h-5 w-5 rotate-45" />
                              </button>
                            ) : (
                              <button className="text-red-600 hover:text-red-700" title="Block"
                                onClick={() => setConfirm({ mode: 'block', id: a.id })}
                              >
                                <NoSymbolIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button className="text-red-600 hover:text-red-700">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((a: any) => (
                  <Card key={a.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{a.title}</h3>
                        <div className="shrink-0 inline-flex items-center gap-2">
                          <Link href={`/articles/${a.id}`} className="text-gray-500 hover:text-gray-700" title="View">
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link href={`/articles/edit/${a.id}`} className="text-blue-600 hover:text-blue-700" title="Edit">
                            <PencilSquareIcon className="h-5 w-5" />
                          </Link>
                          {a.isBlocked ? (
                            <button className="text-emerald-600 hover:text-emerald-700" title="Unblock"
                              onClick={() => setConfirm({ mode: 'unblock', id: a.id })}
                            >
                              <NoSymbolIcon className="h-5 w-5 rotate-45" />
                            </button>
                          ) : (
                            <button className="text-red-600 hover:text-red-700" title="Block"
                              onClick={() => setConfirm({ mode: 'block', id: a.id })}
                            >
                              <NoSymbolIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{a.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">{a.category?.name || 'Article'}</span>
                          <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button className="text-red-600 hover:text-red-700" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bulk actions + Pagination */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={selected.length === 0} onClick={bulkDelete} leftIcon={<TrashIcon />}>
                  Delete selected ({selected.length})
                </Button>
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </CardContent>
        </Card>
        {confirm && (
          <WarningDialog
            title={confirm.mode === 'block' ? 'Block this article?' : confirm.mode === 'unblock' ? 'Unblock this article?' : 'Are you sure?'}
            description={confirm.mode === 'block' ? 'Blocked articles are hidden from everyone until unblocked.' : confirm.mode === 'unblock' ? 'This article will be visible to everyone again.' : 'This action cannot be undone.'}
            confirmLabel={confirm.mode === 'block' ? 'Block' : confirm.mode === 'unblock' ? 'Unblock' : 'Confirm'}
            cancelLabel="Cancel"
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (!confirm) return;
              if (confirm.mode === 'block') interact.mutate(blockAction(confirm.id));
              if (confirm.mode === 'unblock') interact.mutate(unblockAction(confirm.id));
              setConfirm(null);
            }}
          />
        )}
      </div>
    </div>
    </AuthGuard>
  );
};

export default ListMyArticlesPage;
