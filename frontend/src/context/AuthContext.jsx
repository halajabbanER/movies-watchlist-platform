import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE, apiRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Failed to parse saved user:', e);
    }
    return null;
  });

  const [authError, setAuthError] = useState(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier, password) => {
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      const data = await apiRequest(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const register = async (username, email, password) => {
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      const data = await apiRequest(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userId: currentUser ? currentUser.id : null,
        login,
        register,
        logout,
        authError,
        setAuthError,
        isSubmittingAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

