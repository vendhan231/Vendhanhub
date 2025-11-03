// services/api.ts
import {
  User, UserRole, AdminUserUpdateData, AdminDashboardData
} from '../types';

// =====================================================================================
// API Configuration & Helpers
// =====================================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const getAuthHeaders = (isFormData: boolean = false): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch (e) {
    // Ignore if response body is not JSON
  }
  throw new Error(errorMessage);
};

// =====================================================================================
// Authentication API Functions
// =====================================================================================

export interface ParsedLoginCredentials {
  username: string;
  password?: string;
}

export interface ParsedRegisterData {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export const apiLogin = async (credentials: ParsedLoginCredentials): Promise<{ user: User, token: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(credentials),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

export const apiRegister = async (userData: ParsedRegisterData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, { // Note: Backend uses POST /users for creation
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...userData,
      joinDate: new Date().toISOString(),
    }),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

export const apiLogout = async (): Promise<void> => {
  // No backend call is necessary for token-based auth, just clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  return Promise.resolve();
};

// =====================================================================================
// User Management API Functions
// =====================================================================================

export const apiFetchAllUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

export const apiFetchUserById = async (userId: string): Promise<User | undefined> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    if (response.status === 404) return undefined;
    await handleApiError(response);
  }
  return response.json();
};

export const apiAdminUpdateUser = async (userId: string, updates: AdminUserUpdateData): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

export const apiDeleteUser = async (userIdToDelete: string, currentAdminUserId: string): Promise<void> => {
  if (userIdToDelete === currentAdminUserId) {
    throw new Error('Admins cannot delete their own accounts.');
  }
  const response = await fetch(`${API_BASE_URL}/users/${userIdToDelete}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
};

// =====================================================================================
// Password & Profile Picture API Functions
// =====================================================================================

export const apiAdminResetPassword = async (userId: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  if (!response.ok) await handleApiError(response);
};

export const apiUploadProfilePicture = async (userId: string, file: File): Promise<{ profilePictureUrl: string }> => {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
    method: 'POST',
    headers: getAuthHeaders(true), // Pass true for FormData
    body: formData,
  });
  if (!response.ok) await handleApiError(response);
  return response.json();
};

// --- Dashboard API Functions ---
export const fetchAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/admin`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) await handleApiError(response);
  return response.json();
};

export const apiCheckObjectIds = async (projectId: string, objectIds: string[]): Promise<{ duplicates: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/check-duplicates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ objectIds }),
  });

  if (!response.ok) await handleApiError(response);
  return response.json();
};

// NOTE: Other functions for projects, billing, etc., are omitted for brevity.
// You can add them here following the same pattern.

export const apiGetUnreadMessageCount = async (userId: string): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/unread-count/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleApiError(response);
  const data = await response.json();
  return data.count || 0;
};