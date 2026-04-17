// app/_layout.tsx

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/* ──────────────────────────────────────────────────────────
   Prevent Splash Screen Auto-Hide
────────────────────────────────────────────────────────── */

SplashScreen.preventAutoHideAsync();

/* ──────────────────────────────────────────────────────────
   React Query Client (Singleton)
────────────────────────────────────────────────────────── */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        const msg = error?.message || '';
        if (
          error?.name === 'AbortError' ||
          msg.includes('aborted') ||
          msg.includes('signal is aborted')
        ) {
          return false;
        }
        return failureCount < 1;
      },
      networkMode: 'online',
    },
  },
});

/* ──────────────────────────────────────────────────────────
   Loading Screen Component
────────────────────────────────────────────────────────── */

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E85D04" />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Root Layout Navigation (Inner)
────────────────────────────────────────────────────────── */

function RootLayoutInner() {
  const { session, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Set auth token if session exists
        if (session?.access_token) {
          api.setAuthToken(session.access_token);
          console.log('✅ Auth token set in API client');
        } else {
          api.setAuthToken(null);
          console.log('🔓 No auth token');
        }

        // Small delay to ensure everything is initialized
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Error preparing app:', error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    if (!loading) {
      prepare();
    }
  }, [session, loading]);

  // Show loading screen while auth is loading or app is preparing
  if (loading || !isReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        {/* Main Tab Navigation */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />

        {/* Customer Screens */}
        <Stack.Screen 
          name="(customer)" 
          options={{ headerShown: false }} 
        />

        {/* Restaurant Owner Screens */}
        <Stack.Screen 
          name="(restaurant)" 
          options={{ headerShown: false }} 
        />

        {/* Auth Screens */}
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />

        <Stack.Screen 
          name="signup" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />

        <Stack.Screen 
          name="partner" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />

        {/* Restaurant Detail (Direct Route) */}
        <Stack.Screen 
          name="restaurant/[id]" 
          options={{ headerShown: false }} 
        />

        {/* Booking Screens */}
        <Stack.Screen 
          name="booking/[id]" 
          options={{ 
            title: 'Book a Table',
            presentation: 'modal',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="service-booking/[id]" 
          options={{ 
            title: 'Book Service',
            presentation: 'modal',
            headerShown: true,
          }} 
        />

        {/* 404 Screen */}
        <Stack.Screen 
          name="+not-found" 
          options={{ title: 'Not Found' }} 
        />
      </Stack>

      {/* Development Health Check Button */}
      {Platform.OS !== 'web' && __DEV__ && <DevHealthCheckButton />}
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Development Health Check Button
────────────────────────────────────────────────────────── */

function DevHealthCheckButton() {
  const [checking, setChecking] = useState(false);

  const checkBackend = async () => {
    setChecking(true);
    try {
      console.log('🔍 Checking backend health...');
      const health = await api.healthCheck();
      console.log('✅ Backend Health:', health);
      alert(`Backend Status: ${health.status}\n\nDatabase: ${health.database ? 'Connected ✓' : 'Disconnected ✗'}\n\nTimestamp: ${health.timestamp}`);
    } catch (error: any) {
      console.error('❌ Backend health check failed:', error);
      alert(`Backend Error:\n\n${error.message}\n\nMake sure your backend is running on:\n${Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080'}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.devButton}>
      <View style={styles.devButtonInner}>
        <View style={styles.devButtonCircle}>
          <ActivityIndicator 
            size="small" 
            color={checking ? '#fff' : 'transparent'} 
            animating={checking}
          />
        </View>
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Root Layout with Providers
────────────────────────────────────────────────────────── */

export default function RootLayout() {
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Initializing Rork-FineDine...');
      console.log('📱 Platform:', Platform.OS);
      console.log('🌐 API URL:', Constants.expoConfig?.extra?.apiUrl || 'Not configured');
      console.log('🔐 Supabase URL:', Constants.expoConfig?.extra?.supabaseUrl || 'Not configured');
      console.log('🔧 Environment:', __DEV__ ? 'Development' : 'Production');

      // Setup auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth event:', event);

        if (session?.access_token) {
          api.setAuthToken(session.access_token);
        } else {
          api.setAuthToken(null);
        }

        // Invalidate all queries on auth change
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutInner />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/* ──────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  devButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 9999,
  },
  devButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E85D04',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  devButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
