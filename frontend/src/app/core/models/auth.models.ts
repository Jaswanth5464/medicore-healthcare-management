export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  roleId: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  id: number;
  fullName: string;
  email: string;
  roles: string[];
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserState {
  id: number;
  fullName: string;
  email: string;
  role: string; // The ACTIVE role selected by the user
  roles: string[]; // ALL roles they have
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}