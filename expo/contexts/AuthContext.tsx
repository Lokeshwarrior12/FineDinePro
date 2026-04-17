// contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase, auth as supabaseAuth, db } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/* ──────────────────────────────────────────────────────────
   Type Definitions
────────────────────────────────────────────────────────── */

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
  restaurantId?: string; // For restaurant owners
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
  // User state
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Auth methods
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signInPending: boolean;

  signup: (credentials: SignupCredentials) => Promise<void>;
  signupPending: boolean;

  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;

  // Profile methods
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleFavorite: (restaurantId: string) => Promise<void>;
  addPoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;

  // Token helper
  getToken: () => Promise<string | null>;
}

/* ──────────────────────────────────────────────────────────
   Context Creation
────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ──────────────────────────────────────────────────────────
   Storage Keys
────────────────────────────────────────────────────────── */

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FAVORITES: 'user_favorites',
  POINTS: 'user_points',
};

/* ──────────────────────────────────────────────────────────
   Provider Component
────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [signInPending, setSignInPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const fetchingProfileRef = React.useRef(false);
  const lastFetchedUserIdRef = React.useRef<string | null>(null);

  /* ──────────────────────────────────────────────────────────
     Load Stored Profile
  ────────────────────────────────────────────────────────── */

  const loadStoredProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        const profile = JSON.parse(stored);
        setUser(profile);
        console.log('✅ Loaded cached profile:', profile.email);
      }
    } catch (err) {
      console.warn('[Auth] Failed to load stored profile:', err);
    }
  };

  /* ──────────────────────────────────────────────────────────
     Fetch Profile from Database
  ────────────────────────────────────────────────────────── */

  const fetchProfile = async (authUser: SupabaseUser) => {
    if (fetchingProfileRef.current && lastFetchedUserIdRef.current === authUser.id) {
      console.log('⏳ Profile fetch already in progress for:', authUser.id);
      return;
    }

    fetchingProfileRef.current = true;
    lastFetchedUserIdRef.current = authUser.id;

    try {
      setError(null);
      console.log('📥 Building profile from auth metadata (mock mode):', authUser.id);

      // Load cached favorites and points
      const [storedFavorites, storedPoints] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.POINTS),
      ]);

      // Build user profile from auth metadata only (no DB calls)
      const profile: User = {
        id: authUser.id,
        name: authUser.user_metadata?.name || 'User',
        email: authUser.email || '',
        phone: authUser.user_metadata?.phone || '',
        address: '',
        role: (authUser.user_metadata?.role as UserRole) || 'customer',
        points: storedPoints ? parseInt(storedPoints, 10) : 0,
        favorites: storedFavorites ? JSON.parse(storedFavorites) : [],
        photo: authUser.user_metadata?.avatar_url,
        restaurantId: undefined,
        cardDetails: undefined,
      };

      setUser(profile);
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );

      console.log('✅ Profile loaded:', profile.email, `(${profile.role})`);
    } catch (err: any) {
      console.error('[Auth] Profile build failed:', err);
      setError(err.message ?? 'Failed to load profile');
    } finally {
      fetchingProfileRef.current = false;
    }
  };

  /* ──────────────────────────────────────────────────────────
     Initialize Auth State
  ────────────────────────────────────────────────────────── */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('🔐 Initializing auth...');
      
      // Load cached profile first
      await loadStoredProfile();

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        // Set API token
        api.setAuthToken(session.access_token);
        
        // Fetch fresh profile
        await fetchProfile(session.user);
      }

      setLoading(false);
      console.log('✅ Auth initialized');
    };

    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 Auth state changed:', _event);
      
      setSession(session);

      if (session?.user) {
        api.setAuthToken(session.access_token);
        if (_event !== 'INITIAL_SESSION') {
          await fetchProfile(session.user);
        }
      } else {
        setUser(null);
        api.setAuthToken(null);
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER_PROFILE,
          STORAGE_KEYS.FAVORITES,
          STORAGE_KEYS.POINTS,
        ]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ──────────────────────────────────────────────────────────
     Auth Methods
  ────────────────────────────────────────────────────────── */

  /**
   * Sign in user
   */
  const signIn = async ({ email, password }: LoginCredentials) => {
    setSignInPending(true);
    setError(null);

    try {
      console.log('🔑 Signing in:', email);

      const data = await supabaseAuth.signIn(email, password);

      setSession(data.session);
      
      if (data.user) {
        api.setAuthToken(data.session?.access_token || null);
        await fetchProfile(data.user);
      }

      console.log('✅ Sign in successful');
    } catch (err: any) {
      console.error('❌ Sign in failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setSignInPending(false);
    }
  };

  /**
   * Sign up new user
   */
  const signup = async ({
    email,
    password,
    name,
    phone = '',
    role = 'customer',
  }: SignupCredentials) => {
    setSignupPending(true);
    setError(null);

    try {
      console.log('📝 Signing up:', email);

      const data = await supabaseAuth.signUp(email, password, {
        name,
        phone,
        role,
      });

      setSession(data.session);

      if (data.user) {
        api.setAuthToken(data.session?.access_token || null);
        await fetchProfile(data.user);
      }

      console.log('✅ Sign up successful');
    } catch (err: any) {
      console.error('❌ Sign up failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setSignupPending(false);
    }
  };

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      console.log('👋 Signing out');

      await supabaseAuth.signOut();

      setSession(null);
      setUser(null);
      api.setAuthToken(null);

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.FAVORITES,
        STORAGE_KEYS.POINTS,
      ]);

      console.log('✅ Sign out successful');
    } catch (err: any) {
      console.error('❌ Sign out failed:', err);
      throw err;
    }
  };

  /**
   * Refresh session
   */
  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session');

      const session = await supabaseAuth.refreshSession();

      setSession(session);

      if (session?.user) {
        api.setAuthToken(session.access_token);
        await fetchProfile(session.user);
      }

      console.log('✅ Session refreshed');
    } catch (err: any) {
      console.error('❌ Session refresh failed:', err);
      throw err;
    }
  };

  /* ──────────────────────────────────────────────────────────
     Profile Methods
  ────────────────────────────────────────────────────────── */

  /**
   * Update user profile
   */
  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('📝 Updating profile:', Object.keys(data));

      const updated = { ...user, ...data };
      setUser(updated);
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(updated)
      );

      console.log('✅ Profile updated');
    } catch (err: any) {
      console.error('❌ Profile update failed:', err);
      throw err;
    }
  };

  /**
   * Toggle favorite restaurant
   */
  const toggleFavorite = useCallback(
    async (restaurantId: string) => {
      if (!user) return;

      try {
        const isFavorite = user.favorites.includes(restaurantId);

        setUser((prev) => {
          if (!prev) return prev;

          const favorites = isFavorite
            ? prev.favorites.filter((id) => id !== restaurantId)
            : [...prev.favorites, restaurantId];

          AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));

          return { ...prev, favorites };
        });

        console.log(
          `${isFavorite ? '💔 Removed' : '❤️ Added'} favorite:`,
          restaurantId
        );
      } catch (err) {
        console.error('❌ Toggle favorite failed:', err);
        Alert.alert('Error', 'Failed to update favorites');
      }
    },
    [user]
  );

  /**
   * Add loyalty points
   */
  const addPoints = useCallback((points: number) => {
    setUser((prev) => {
      if (!prev) return prev;

      const newPoints = prev.points + points;
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, String(newPoints));

      console.log(`🎁 Added ${points} points. Total: ${newPoints}`);

      return { ...prev, points: newPoints };
    });
  }, []);

  /**
   * Update user state (optimistic)
   */
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  /**
   * Get current auth token
   */
  const getToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  /* ──────────────────────────────────────────────────────────
     Context Value
  ────────────────────────────────────────────────────────── */

  const value: AuthContextValue = {
    user,
    session,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ──────────────────────────────────────────────────────────
   Custom Hook
────────────────────────────────────────────────────────── */

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext;
