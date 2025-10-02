import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  bulkDeleteArticles,
  handleArticleInteraction,
  PaginationOptions,
  SearchOptions,
} from '@/helpers/database';
import { validateArticleData, ValidationResult } from '@/helpers/validation';
import { ErrorCode } from '@/constants/status-codes';

export interface ArticleFilters extends SearchOptions {
  owner?: 'me' | 'all';
}

export interface CreateArticleData {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  categoryId: string;
}

export interface UpdateArticleData {
  title?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  tags?: string[];
  categoryId?: string;
}

export class ArticleService {

  static async getArticles(
    options: PaginationOptions & ArticleFilters & { currentUserId?: string }
  ) {
    return getArticles(options);
  }


  static async getArticleById(id: string, currentUserId?: string) {
    return getArticleById(id, currentUserId);
  }

 
  static async createArticle(
    data: CreateArticleData,
    authorId: string
  ): Promise<{ success: boolean; article?: any; errors?: ValidationResult['errors'] }> {

    const validation = validateArticleData(data);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    try {
      const article = await createArticle({
        ...data,
        authorId,
      });

      return {
        success: true,
        article,
      };
    } catch (error) {
      console.error('Error creating article:', error);
      return {
        success: false,
        errors: [
          {
            field: 'general',
            code: ErrorCode.OPERATION_FAILED,
            message: 'Failed to create article',
          },
        ],
      };
    }
  }

  
  static async updateArticle(
    id: string,
    data: UpdateArticleData,
    authorId: string
  ): Promise<{ success: boolean; article?: any; errors?: ValidationResult['errors'] }> {

    const validation = validateArticleData(data);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    try {
      const article = await updateArticle(id, data, authorId);
      
      if (!article) {
        return {
          success: false,
          errors: [
            {
              field: 'id',
              code: ErrorCode.NOT_FOUND,
              message: 'Article not found or access denied',
            },
          ],
        };
      }

      return {
        success: true,
        article,
      };
    } catch (error) {
      console.error('Error updating article:', error);
      return {
        success: false,
        errors: [
          {
            field: 'general',
            code: ErrorCode.OPERATION_FAILED,
            message: 'Failed to update article',
          },
        ],
      };
    }
  }


  static async deleteArticle(
    id: string,
    authorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await deleteArticle(id, authorId);
      
      if (!success) {
        return {
          success: false,
          error: 'Article not found or access denied',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting article:', error);
      return {
        success: false,
        error: 'Failed to delete article',
      };
    }
  }

 
  static async bulkDeleteArticles(
    ids: string[],
    authorId: string
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const deletedCount = await bulkDeleteArticles(ids, authorId);
      
      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      console.error('Error bulk deleting articles:', error);
      return {
        success: false,
        error: 'Failed to delete articles',
      };
    }
  }

  
  static async likeArticle(
    articleId: string,
    userId: string
  ): Promise<{ success: boolean; newCount?: number; error?: string }> {
    try {
      const result = await handleArticleInteraction(articleId, userId, 'like');
      
      if (!result.success) {
        return {
          success: false,
          error: 'Article already liked or not found',
        };
      }

      return {
        success: true,
        newCount: result.newCount,
      };
    } catch (error) {
      console.error('Error liking article:', error);
      return {
        success: false,
        error: 'Failed to like article',
      };
    }
  }
 
  static async unlikeArticle(
    articleId: string,
    userId: string
  ): Promise<{ success: boolean; newCount?: number; error?: string }> {
    try {
      const result = await handleArticleInteraction(articleId, userId, 'unlike');
      
      if (!result.success) {
        return {
          success: false,
          error: 'Article not liked or not found',
        };
      }

      return {
        success: true,
        newCount: result.newCount,
      };
    } catch (error) {
      console.error('Error unliking article:', error);
      return {
        success: false,
        error: 'Failed to unlike article',
      };
    }
  }

 
  static async bookmarkArticle(
    articleId: string,
    userId: string
  ): Promise<{ success: boolean; newCount?: number; error?: string }> {
    try {
      const result = await handleArticleInteraction(articleId, userId, 'bookmark');
      
      if (!result.success) {
        return {
          success: false,
          error: 'Article already bookmarked or not found',
        };
      }

      return {
        success: true,
        newCount: result.newCount,
      };
    } catch (error) {
      console.error('Error bookmarking article:', error);
      return {
        success: false,
        error: 'Failed to bookmark article',
      };
    }
  }

 
  static async unbookmarkArticle(
    articleId: string,
    userId: string
  ): Promise<{ success: boolean; newCount?: number; error?: string }> {
    try {
      const result = await handleArticleInteraction(articleId, userId, 'unbookmark');
      
      if (!result.success) {
        return {
          success: false,
          error: 'Article not bookmarked or not found',
        };
      }

      return {
        success: true,
        newCount: result.newCount,
      };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return {
        success: false,
        error: 'Failed to remove bookmark',
      };
    }
  }
}
