
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiLogin, apiRegister, apiLogout, ParsedLoginCredentials, ParsedRegisterData, apiFetchUserById } from '../services/api'; 

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: ParsedLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: ParsedRegisterData) => Promise<void>; 
  updateUserInContext: (updatedUser: User) => void; 
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // In a real app, you'd validate the token with the backend and fetch fresh user data.
        // e.g., const freshUser = await apiFetchCurrentUser(); setUser(freshUser); setIsAuthenticated(true);
        // For now, we'll try to use the stored user if a token exists, as a bridge.
        const storedUserString = localStorage.getItem('user');
        if (storedUserString) {
          try {
            const parsedUser: User = JSON.parse(storedUserString);
            // Optionally, re-fetch user data to ensure it's up-to-date
            // const freshUserData = await apiFetchUserById(parsedUser.id);
            // if(freshUserData) setUser(freshUserData); else setUser(parsedUser)
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            // Invalid stored user, clear it
            localStorage.removeItem('user');
            localStorage.removeItem('authToken'); // Also remove token if user data is corrupt
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
            // Token exists but no user data - this state ideally shouldn't happen long-term
            // Attempt to fetch user by a 'me' endpoint or similar
            // For now, treat as not logged in if user data is missing
            localStorage.removeItem('authToken');
            setUser(null);
            setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    attemptAutoLogin();
  }, []);

  const login = async (credentials: ParsedLoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      // apiLogin will now be an async call to your backend
      const { user: loggedInUser, token } = await apiLogin(credentials); 
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('authToken', token);
      // Storing the user object in localStorage is okay for now, but ensure sensitive data isn't stored
      // if not needed, or rely on fetching it fresh using the token.
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: ParsedRegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      // apiRegister will now be an async call to your backend (or updated mock)
      await apiRegister(userData);
      // The success alert (`User ${newUser.username} registered successfully! Please login.`)
      // has been removed as it was suited for public registration.
      // Admin registration success is handled in Register.tsx.
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      // Important: Re-throw the error if Register.tsx needs to know about it to prevent navigation
      throw err; 
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogout(); // Call backend to invalidate token if applicable
    } catch (err: any)
{
      console.error("Logout API call error (if any):", err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const updateUserInContext = (updatedUser: User) => {
    setUser(prevUser => {
      // Ensure existing fields are preserved if updatedUser is partial, though for profile update it should be complete.
      const newUserState = prevUser ? { ...prevUser, ...updatedUser } : updatedUser;
      localStorage.setItem('user', JSON.stringify(newUserState)); // Update stored user object
      return newUserState;
    });
    // Note: The token remains the same, only user data is updated.
  };
  
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register, error, clearError, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};
