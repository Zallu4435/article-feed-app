export interface ArticleResponse {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  authorId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  author?: UserResponse;
  category?: CategoryResponse;
}

export interface CreateArticleRequest {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  categoryId: string;
}

export interface UpdateArticleRequest {
  title?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  tags?: string[];
  categoryId?: string;
}

// Interaction types are now embedded in Article; standalone responses removed

// Import UserResponse and CategoryResponse for type reference
import type { UserResponse } from './user';
import type { CategoryResponse } from './category';
