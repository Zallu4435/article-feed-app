'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CategoriesPage() {
  const { data } = useSWR('/api/categories', fetcher);
  const categories = (data?.data?.categories ?? []) as { id: string; name: string; description?: string }[];
  const [search, setSearch] = React.useState('');
  const filtered = React.useMemo(
    () => categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-600 mt-1">{filtered.length} categories</p>
        </div>
        <Link href="/articles/list">
          <Button variant="outline" leftIcon={<Squares2X2Icon />}>Browse Articles</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="max-w-md">
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<TagIcon />}
            />
          </div>
        </CardContent>
      </Card>

      {data === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} loading><div /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-600">
            No categories found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-semibold">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <CardDescription>{c.description || `Articles curated in ${c.name}`}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={`/dashboard?categoryId=${c.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-700 hover:underline text-sm font-medium">
                  View articles
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


