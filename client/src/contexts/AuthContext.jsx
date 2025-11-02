import React, { createContext, useContext, useState, useEffect } from 'react';
import { SERVER_URL } from '../config.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const saveCustomBoard = async (customBoard) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/custom-board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customBoard }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error saving custom board:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const fetchCustomBoard = async () => {
    if (!user) return null;

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/custom-board`);
      const data = await response.json();
      
      if (data.success) {
        return data.customBoard;
      }
      return null;
    } catch (error) {
      console.error('Error fetching custom board:', error);
      return null;
    }
  };

  const addFriend = async (friendUsername) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendUsername }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding friend:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const removeFriend = async (friendId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/friends/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const fetchFriends = async () => {
    if (!user) return [];

    try {
      const response = await fetch(`${SERVER_URL}/api/user/${user.id}/friends`);
      const data = await response.json();
      
      if (data.success) {
        return data.friends;
      }
      return [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  };

  const searchUsers = async (username) => {
    if (!user) return [];

    try {
      const response = await fetch(`${SERVER_URL}/api/search/users/${username}`);
      const data = await response.json();
      
      if (data.success) {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshUserData,
    saveCustomBoard,
    fetchCustomBoard,
    addFriend,
    removeFriend,
    fetchFriends,
    searchUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

