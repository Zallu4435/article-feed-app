export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  password: string;
}

export interface UserPreferenceResponse {
  id: string;
  userId: string;
  categoryId: string;
  createdAt: string;
  category?: CategoryResponse;
}

// Import CategoryResponse for type reference
import type { CategoryResponse } from './category';
