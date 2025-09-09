'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentTextIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import { useArticles } from '@/hooks/useArticles';
import type { SearchResultsProps } from '@/types';

const SearchResults: React.FC<SearchResultsProps> = ({ query, isOpen, onClose, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Search for articles with the query
  const { data: searchData, isLoading } = useArticles({ 
    page: 1, 
    limit: 8, 
    search: query.trim() || undefined,
    excludeBlocked: true 
  });

  const articles = searchData?.articles || [];
  const totalResults = searchData?.pagination?.total || 0;

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, articles.length));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex < articles.length) {
            const article = articles[selectedIndex];
            router.push(`/articles/${article.id}`);
            onSelect();
          } else if (selectedIndex === articles.length && query.trim()) {
            // Navigate to search results page
            router.push(`/articles/list?search=${encodeURIComponent(query.trim())}`);
            onSelect();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, articles, query, router, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || !query.trim()) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      <div ref={resultsRef} className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            Searching...
          </div>
        ) : articles.length > 0 ? (
          <>
            {/* Article Results */}
            {articles.map((article: any, index: number) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                onClick={onSelect}
                data-index={index}
                className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                  selectedIndex === index ? 'bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      {article.author && (
                        <div className="flex items-center space-x-1">
                          <UserIcon className="w-3 h-3" />
                          <span>{article.author.firstName} {article.author.lastName}</span>
                        </div>
                      )}
                      {article.category && (
                        <div className="flex items-center space-x-1">
                          <TagIcon className="w-3 h-3" />
                          <span>{article.category.name}</span>
                        </div>
                      )}
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* View All Results */}
            {totalResults > articles.length && (
              <button
                onClick={() => {
                  router.push(`/articles/list?search=${encodeURIComponent(query.trim())}`);
                  onSelect();
                }}
                data-index={articles.length}
                className={`w-full px-4 py-3 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-200 transition-colors ${
                  selectedIndex === articles.length ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>View all {totalResults} results for "{query}"</span>
                </div>
              </button>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No articles found for "{query}"</p>
            <p className="text-xs text-gray-400 mt-1">Try different keywords or check spelling</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
