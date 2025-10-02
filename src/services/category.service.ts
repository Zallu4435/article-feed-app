import { getCategories, createCategory, PaginationOptions } from '@/helpers/database';
import prisma from '@/lib/prisma';

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export class CategoryService {

  static async getCategories(options: PaginationOptions & { search?: string }) {
    try {
      return await getCategories(options);
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }
 
  static async getAllCategories() {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('Error getting all categories:', error);
      return {
        success: false,
        error: 'Failed to get categories',
      };
    }
  }

  static async getCategoryById(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!category) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      return {
        success: true,
        category,
      };
    } catch (error) {
      console.error('Error getting category by ID:', error);
      return {
        success: false,
        error: 'Failed to get category',
      };
    }
  }


  static async createCategory(
    data: CreateCategoryData
  ): Promise<{ success: boolean; category?: any; error?: string }> {
    try {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingCategory) {
        return {
          success: false,
          error: 'Category with this name already exists',
        };
      }

      const category = await createCategory(data);

      return {
        success: true,
        category,
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        error: 'Failed to create category',
      };
    }
  }

 
  static async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<{ success: boolean; category?: any; error?: string }> {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      if (data.name && data.name !== existingCategory.name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            name: {
              equals: data.name,
              mode: 'insensitive',
            },
            id: { not: id },
          },
        });

        if (duplicateCategory) {
          return {
            success: false,
            error: 'Category with this name already exists',
          };
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data,
      });

      return {
        success: true,
        category,
      };
    } catch (error) {
      console.error('Error updating category:', error);
      return {
        success: false,
        error: 'Failed to update category',
      };
    }
  }

  static async deleteCategory(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const articlesUsingCategory = await prisma.article.count({
        where: { categoryId: id },
      });

      if (articlesUsingCategory > 0) {
        return {
          success: false,
          error: 'Cannot delete category as it is being used by articles',
        };
      }

      const existingCategory = await prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      await prisma.category.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        error: 'Failed to delete category',
      };
    }
  }


  static async getCategoryStats(id: string) {
    try {
      const [category, articleCount] = await Promise.all([
        prisma.category.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        }),
        prisma.article.count({
          where: {
            categoryId: id,
            isBlocked: false,
          },
        }),
      ]);

      if (!category) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      return {
        success: true,
        stats: {
          ...category,
          articleCount,
        },
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      return {
        success: false,
        error: 'Failed to get category statistics',
      };
    }
  }


  static async searchCategories(query: string, limit: number = 10) {
    try {
      const categories = await prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
      });

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('Error searching categories:', error);
      return {
        success: false,
        error: 'Failed to search categories',
      };
    }
  }
}
