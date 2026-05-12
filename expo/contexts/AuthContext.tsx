// contexts/AuthContext.tsx

import React, { useCallback, useEffect, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export type UserRole = 'customer' | 'restaurant_owner' | 'admin';

export interface CardDetails {
  number: string;
  holderName: string;
  expiryDate: string;
  cvv: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: UserRole;
  points: number;
  favorites: string[];
  photo?: string;
  restaurantId?: string;
  cardDetails?: CardDetails;
  createdAt?: string;
  updatedAt?: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  session: null;
  loading: boolean;
  error: string | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signInPending: boolean;
  signup: (credentials: SignupCredentials) => Promise<void>;
  signupPending: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleFavorite: (restaurantId: string) => Promise<void>;
  addPoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;
  getToken: () => Promise<string | null>;
}

const STORAGE_KEYS = {
  USER_PROFILE: 'sample_user_profile',
  FAVORITES: 'sample_user_favorites',
  POINTS: 'sample_user_points',
};

const SAMPLE_USER: User = {
  id: 'sample-user',
  email: 'guest@primedine.demo',
  name: 'Demo Guest',
  phone: '+1 555 010 2048',
  address: '123 Sample Street, New York',
  role: 'customer',
  points: 2450,
  favorites: ['1', '2'],
  restaurantId: '1',
};

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<User | null>(SAMPLE_USER);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signInPending, setSignInPending] = useState<boolean>(false);
  const [signupPending, setSignupPending] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const loadSampleProfile = async (): Promise<void> => {
      try {
        const [storedProfile, storedFavorites, storedPoints] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.POINTS),
        ]);

        if (!mounted) return;

        const cachedProfile = storedProfile ? JSON.parse(storedProfile) as User : SAMPLE_USER;
        const favorites = storedFavorites ? JSON.parse(storedFavorites) as string[] : cachedProfile.favorites;
        const points = storedPoints ? Number.parseInt(storedPoints, 10) : cachedProfile.points;

        setUser({ ...cachedProfile, favorites, points: Number.isFinite(points) ? points : SAMPLE_USER.points });
      } catch (err) {
        console.warn('[Auth] Failed to load sample profile:', err);
        if (mounted) setUser(SAMPLE_USER);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSampleProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const persistUser = useCallback(async (nextUser: User): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(nextUser));
  }, []);

  const signIn = async ({ email }: LoginCredentials): Promise<void> => {
    setSignInPending(true);
    setError(null);
    try {
      const nextUser: User = { ...SAMPLE_USER, email: email || SAMPLE_USER.email };
      setUser(nextUser);
      await persistUser(nextUser);
    } finally {
      setSignInPending(false);
    }
  };

  const signup = async ({ email, name, phone = '', role = 'customer' }: SignupCredentials): Promise<void> => {
    setSignupPending(true);
    setError(null);
    try {
      const nextUser: User = { ...SAMPLE_USER, email, name, phone, role };
      setUser(nextUser);
      await persistUser(nextUser);
    } finally {
      setSignupPending(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setUser(SAMPLE_USER);
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER_PROFILE, STORAGE_KEYS.FAVORITES, STORAGE_KEYS.POINTS]);
  };

  const refreshSession = async (): Promise<void> => {
    setError(null);
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No sample user loaded');
    const updated = { ...user, ...data };
    setUser(updated);
    await persistUser(updated);
  };

  const toggleFavorite = useCallback(async (restaurantId: string): Promise<void> => {
    if (!user) return;

    try {
      const isFavorite = user.favorites.includes(restaurantId);
      const favorites = isFavorite
        ? user.favorites.filter((id) => id !== restaurantId)
        : [...user.favorites, restaurantId];
      const updated = { ...user, favorites };

      setUser(updated);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites)),
        persistUser(updated),
      ]);
    } catch (err) {
      console.error('[Auth] Toggle sample favorite failed:', err);
      Alert.alert('Error', 'Failed to update favorites');
    }
  }, [persistUser, user]);

  const addPoints = useCallback((points: number): void => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, points: prev.points + points };
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, String(updated.points));
      AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>): void => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getToken = async (): Promise<string | null> => null;

  return {
    user,
    session: null,
    loading,
    error,
    signIn,
    signInPending,
    signup,
    signupPending,
    signOut,
    refreshSession,
    updateProfile,
    toggleFavorite,
    addPoints,
    updateUser,
    getToken,
  };
});

export default useAuth;
