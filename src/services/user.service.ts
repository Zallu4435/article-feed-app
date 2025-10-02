import bcrypt from 'bcryptjs';
import { getUserProfile, updateUserProfile, getDashboardStats } from '@/helpers/database';
import { validateRegistrationData, ValidationResult } from '@/helpers/validation';
import { generateToken, generateRefreshToken } from '@/helpers/auth';
import { ErrorCode } from '@/constants/status-codes';
import prisma from '@/lib/prisma';

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
}

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  profilePictureUrl?: string;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
}

export class UserService {
  static async checkExistingUser(
    email: string,
    phone: string
  ): Promise<{
    exists: boolean;
    conflicts: { email?: string; phone?: string };
  }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: phone },
        ],
      },
      select: { email: true, phone: true }
    });

    if (!existingUser) {
      return { exists: false, conflicts: {} };
    }

    const conflicts: { email?: string; phone?: string } = {};
    
    if (existingUser.email === email.toLowerCase()) {
      conflicts.email = 'An account with this email already exists';
    }
    if (existingUser.phone === phone) {
      conflicts.phone = 'An account with this phone number already exists';
    }

    return { exists: true, conflicts };
  }


  static async registerUser(
    data: UserRegistrationData
  ): Promise<{ success: boolean; user?: any; errors?: ValidationResult['errors'] }> {

    const validation = validateRegistrationData(data);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    try {
      const existingCheck = await UserService.checkExistingUser(data.email, data.phone);
      
      if (existingCheck.exists) {
        const errors: ValidationResult['errors'] = [];
        
        if (existingCheck.conflicts.email) {
          errors.push({
            field: 'email',
            code: ErrorCode.ALREADY_EXISTS,
            message: existingCheck.conflicts.email,
          });
        }
        
        if (existingCheck.conflicts.phone) {
          errors.push({
            field: 'phone',
            code: ErrorCode.ALREADY_EXISTS,
            message: existingCheck.conflicts.phone,
          });
        }
        
        return {
          success: false,
          errors,
        };
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          dateOfBirth: new Date(data.dateOfBirth),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        errors: [
          {
            field: 'general',
            code: ErrorCode.OPERATION_FAILED,
            message: 'Failed to register user',
          },
        ],
      };
    }
  }


  static async loginUser(
    credentials: LoginCredentials
  ): Promise<{ 
    success: boolean; 
    user?: any; 
    accessToken?: string; 
    refreshToken?: string; 
    error?: { code: ErrorCode; message: string } 
  }> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: credentials.emailOrPhone },
            { phone: credentials.emailOrPhone },
          ],
        },
      });

      if (!user) {
        return {
          success: false,
          error: {
            code: ErrorCode.USER_NOT_FOUND,
            message: 'No account found with this email/phone',
          },
        };
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: {
            code: ErrorCode.INVALID_PASSWORD,
            message: 'Incorrect password',
          },
        };
      }
 
      const accessToken = generateToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.OPERATION_FAILED,
          message: 'Login failed',
        },
      };
    }
  }


  static async getUserProfile(userId: string) {
    try {
      const user = await getUserProfile(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {
        success: false,
        error: 'Failed to get user profile',
      };
    }
  }


  static async updateUserProfile(
    userId: string,
    data: UserProfileData
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await updateUserProfile(userId, data);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
  }


  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: 'Failed to change password',
      };
    }
  }


  static async getDashboardStats(userId: string) {
    try {
      const userPreferences = await prisma.userPreference.findMany({
        where: { userId },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      const hasPreferences = userPreferences.length > 0;
      const preferredCategoryIds = userPreferences.map(p => p.categoryId);

      const allCategories = await prisma.category.findMany({
        select: { id: true, name: true },
      });

      const rawArticles = await prisma.article.findMany({
        where: {
          isBlocked: false,
          ...(hasPreferences && { categoryId: { in: preferredCategoryIds } }),
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, profilePicture: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10, 
      });

      const articles = rawArticles.map(article => ({
        ...article,
        likedByCurrentUser: (article.likers ?? []).includes(userId),
        bookmarkedByCurrentUser: (article.bookmarkers ?? []).includes(userId),
      }));

      const [articlesViewed, articlesLiked, articlesBookmarked] = await Promise.all([
        prisma.article.count({
          where: {
            viewers: {
              has: userId,
            },
          },
        }),
        prisma.article.count({
          where: {
            likers: {
              has: userId,
            },
          },
        }),
        prisma.article.count({
          where: {
            bookmarkers: {
              has: userId,
            },
          },
        }),
      ]);

      const stats = {
        articlesRead: articlesViewed,
        likesGiven: articlesLiked,
        bookmarks: articlesBookmarked,
        readingStreakDays: 0, 
      };

      return {
        success: true,
        stats: {
          articles,
          preferences: userPreferences,
          allCategories,
          hasPreferences,
          stats,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        success: false,
        error: 'Failed to get dashboard data',
      };
    }
  }


  static async verifyUserEmail(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying user email:', error);
      return {
        success: false,
        error: 'Failed to verify email',
      };
    }
  }


  static async getUserPreferences(userId: string) {
    try {
      const preferences = await prisma.userPreference.findMany({
        where: { userId },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        success: true,
        preferences,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        success: false,
        error: 'Failed to get preferences',
      };
    }
  }

  static async addUserPreference(
    userId: string,
    categoryId: string
  ): Promise<{ success: boolean; preference?: any; error?: string }> {
    try {
      const existingPreference = await prisma.userPreference.findFirst({
        where: {
          userId,
          categoryId,
        },
      });

      if (existingPreference) {
        return {
          success: false,
          error: 'Preference already exists',
        };
      }

      const preference = await prisma.userPreference.create({
        data: {
          userId,
          categoryId,
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      });

      return {
        success: true,
        preference,
      };
    } catch (error) {
      console.error('Error adding user preference:', error);
      return {
        success: false,
        error: 'Failed to add preference',
      };
    }
  }


  static async removeUserPreference(
    userId: string,
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userPreference.deleteMany({
        where: {
          userId,
          categoryId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing user preference:', error);
      return {
        success: false,
        error: 'Failed to remove preference',
      };
    }
  }


  static async resetPassword(userId: string, newPassword: string) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Failed to reset password' };
    }
  }

}
