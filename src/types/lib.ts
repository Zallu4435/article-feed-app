export interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string | number | boolean | undefined>;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface ArticlePayload {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  categoryId: string;
}
