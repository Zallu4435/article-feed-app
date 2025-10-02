import prisma from '@/lib/prisma';
import { initializeDatabase } from '@/lib/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchOptions {
  search?: string;
  categoryId?: string;
  authorId?: string;
  excludeBlocked?: boolean;
  tags?: string[];
}


export async function ensureDatabaseConnection(): Promise<void> {
  await initializeDatabase();
}


export async function paginatedQuery<T>(
  model: any,
  options: PaginationOptions & {
    where?: any;
    include?: any;
    select?: any;
    orderBy?: any;
  }
): Promise<PaginationResult<T>> {
  const { page, limit, where, include, select, orderBy } = options;
  const offset = (page - 1) * limit;

  const [total, data] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      include,
      select,
      orderBy,
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


export async function getArticles(
  options: PaginationOptions & SearchOptions & {
    currentUserId?: string;
    owner?: 'me' | 'all';
  }
): Promise<PaginationResult<any>> {
  const {
    page,
    limit,
    search,
    categoryId,
    authorId,
    excludeBlocked = true,
    tags,
    currentUserId,
    owner = 'me',
  } = options;

  const where: any = {};

  if (owner === 'me' && currentUserId) {
    where.authorId = currentUserId;
  } else if (authorId) {
    where.authorId = authorId;
  }

  if (excludeBlocked) {
    where.isBlocked = false;
  }

  if (categoryId) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(categoryId);
    if (isUuid) {
      where.categoryId = categoryId;
    } else {
      where.category = { name: { equals: categoryId, mode: 'insensitive' } };
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  if (tags && tags.length > 0) {
    where.tags = { hasEvery: tags };
  }

  return paginatedQuery(prisma.article, {
    page,
    limit,
    where,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}


export async function getArticleById(
  id: string,
  currentUserId?: string
): Promise<any | null> {
  const article = await prisma.article.findFirst({
    where: { id, isBlocked: false },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!article) {
    return null;
  }

  return {
    ...article,
    likedByCurrentUser: currentUserId ? (article.likers ?? []).includes(currentUserId) : false,
    bookmarkedByCurrentUser: currentUserId ? (article.bookmarkers ?? []).includes(currentUserId) : false,
  };
}


export async function createArticle(data: {
  title: string;
  description: string;
  content: string;
  imageUrl?: string | null;
  tags?: string[];
  authorId: string;
  categoryId: string;
}): Promise<any> {
  return prisma.article.create({
    data: {
      ...data,
      tags: data.tags || [],
      isBlocked: false,
      viewers: [],
      likers: [],
      bookmarkers: [],
      viewsCount: 0,
      likesCount: 0,
      bookmarksCount: 0,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}


export async function updateArticle(
  id: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    imageUrl?: string | null;
    tags?: string[];
    categoryId?: string;
  },
  authorId: string
): Promise<any | null> {
  const existingArticle = await prisma.article.findFirst({
    where: { id, authorId },
  });

  if (!existingArticle) {
    return null;
  }

  return prisma.article.update({
    where: { id },
    data,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}


export async function deleteArticle(id: string, authorId: string): Promise<boolean> {
  try {
    const result = await prisma.article.deleteMany({
      where: { id, authorId },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}


export async function bulkDeleteArticles(ids: string[], authorId: string): Promise<number> {
  const result = await prisma.article.deleteMany({
    where: {
      id: { in: ids },
      authorId,
    },
  });
  return result.count;
}


export async function getCategories(
  options: PaginationOptions & { search?: string }
): Promise<PaginationResult<any>> {
  const { page, limit, search } = options;
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  return paginatedQuery(prisma.category, {
    page,
    limit,
    where,
    orderBy: { name: 'asc' },
  });
}


export async function createCategory(data: {
  name: string;
  description?: string;
}): Promise<any> {
  return prisma.category.create({
    data,
  });
}


export async function getUserProfile(userId: string): Promise<any | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    profilePictureUrl?: string;
  }
): Promise<any | null> {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      profilePicture: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


export async function getDashboardStats(userId: string): Promise<{
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  recentArticles: any[];
}> {
  const [totalArticles, articles] = await Promise.all([
    prisma.article.count({
      where: { authorId: userId, isBlocked: false },
    }),
    prisma.article.findMany({
      where: { authorId: userId, isBlocked: false },
      select: {
        id: true,
        title: true,
        viewsCount: true,
        likesCount: true,
        bookmarksCount: true,
        createdAt: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalViews = articles.reduce((sum, article) => sum + (article.viewsCount || 0), 0);
  const totalLikes = articles.reduce((sum, article) => sum + (article.likesCount || 0), 0);
  const totalBookmarks = articles.reduce((sum, article) => sum + (article.bookmarksCount || 0), 0);

  return {
    totalArticles,
    totalViews,
    totalLikes,
    totalBookmarks,
    recentArticles: articles,
  };
}


export async function handleArticleInteraction(
  articleId: string,
  userId: string,
  action: 'like' | 'unlike' | 'bookmark' | 'unbookmark'
): Promise<{ success: boolean; newCount: number }> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { likers: true, bookmarkers: true, likesCount: true, bookmarksCount: true },
  });

  if (!article) {
    return { success: false, newCount: 0 };
  }

  let updateData: any = {};
  let newCount = 0;

  switch (action) {
    case 'like':
      if (!(article.likers || []).includes(userId)) {
        updateData.likers = [...(article.likers || []), userId];
        updateData.likesCount = (article.likesCount || 0) + 1;
        newCount = updateData.likesCount;
      } else {
        return { success: false, newCount: article.likesCount || 0 };
      }
      break;

    case 'unlike':
      if ((article.likers || []).includes(userId)) {
        updateData.likers = (article.likers || []).filter((id: string) => id !== userId);
        updateData.likesCount = Math.max(0, (article.likesCount || 0) - 1);
        newCount = updateData.likesCount;
      } else {
        return { success: false, newCount: article.likesCount || 0 };
      }
      break;

    case 'bookmark':
      if (!(article.bookmarkers || []).includes(userId)) {
        updateData.bookmarkers = [...(article.bookmarkers || []), userId];
        updateData.bookmarksCount = (article.bookmarksCount || 0) + 1;
        newCount = updateData.bookmarksCount;
      } else {
        return { success: false, newCount: article.bookmarksCount || 0 };
      }
      break;

    case 'unbookmark':
      if ((article.bookmarkers || []).includes(userId)) {
        updateData.bookmarkers = (article.bookmarkers || []).filter((id: string) => id !== userId);
        updateData.bookmarksCount = Math.max(0, (article.bookmarksCount || 0) - 1);
        newCount = updateData.bookmarksCount;
      } else {
        return { success: false, newCount: article.bookmarksCount || 0 };
      }
      break;
  }

  await prisma.article.update({
    where: { id: articleId },
    data: updateData,
  });

  return { success: true, newCount };
}
