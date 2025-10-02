export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REGISTER_VERIFY: '/api/auth/register/verify',
    REGISTER_RESEND: '/api/auth/register/resend',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VALIDATE_RESET_TOKEN: '/api/auth/validate-reset-token',
    VALIDATE_RESET_ACCESS: '/api/auth/validate-reset-access',
    VERIFY_RESET_OTP: '/api/auth/verify-reset-otp',
  },

  USERS: {
    PROFILE: '/api/users/profile',
    PROFILE_UPLOAD: '/api/users/profile/upload',
    PREFERENCES: '/api/users/preferences',
    CHANGE_PASSWORD: '/api/users/change-password',
  },

  ARTICLES: {
    BASE: '/api/articles',
    BY_ID: (id: string) => `/api/articles/${id}`,
    BULK_DELETE: '/api/articles/bulk-delete',
  },

  CATEGORIES: {
    BASE: '/api/categories',
    BY_ID: (id: string) => `/api/categories/${id}`,
  },

  INTERACTIONS: {
    ARTICLE_INTERACTIONS: '/api/article-interactions',
    ARTICLE_VIEWS: '/api/article-views',
  },

  UTILS: {
    UPLOAD: '/api/upload',
    DASHBOARD: '/api/dashboard',
  },
} as const;

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',

  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  ARTICLES: {
    BASE: '/articles',
    LIST: '/articles/list',
    CREATE: '/articles/create',
    VIEW: (id: string) => `/articles/${id}`,
    EDIT: (id: string) => `/articles/edit/${id}`,
  },

  CATEGORIES: {
    BASE: '/categories',
    VIEW: (id: string) => `/categories/${id}`,
  },
} as const;

export const EXTERNAL_ROUTES = {
  TWITTER_SHARE: (url: string, text: string) => 
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  
  FACEBOOK_SHARE: (url: string) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  
  LINKEDIN_SHARE: (url: string, title: string, summary: string) => 
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`,
  
  WHATSAPP_SHARE: (text: string, url: string) => 
    `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,

  EMAIL_SHARE: (subject: string, body: string) => 
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
} as const;

export type ArticleRouteParams = {
  id: string;
};

export type CategoryRouteParams = {
  id: string;
};

export type ArticleQueryParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  excludeBlocked?: boolean;
  owner?: 'me' | 'all';
};

export type CategoryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export const buildApiRoute = (baseRoute: string, params?: Record<string, string | number>) => {
  let route = baseRoute;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      route = route.replace(`:${key}`, String(value));
    });
  }
  return route;
};

export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const buildFullRoute = (baseRoute: string, queryParams?: Record<string, any>): string => {
  const queryString = queryParams ? buildQueryString(queryParams) : '';
  return `${baseRoute}${queryString}`;
};
