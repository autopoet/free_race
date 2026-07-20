import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, AppStateStatus, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const publishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

const validSupabaseUrl =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);

export const isSupabaseConfigured =
  validSupabaseUrl &&
  publishableKey.length > 20 &&
  !publishableKey.includes('your_key');

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('尚未配置 Supabase，当前只能使用本机演示模式');
  }
  return supabase;
}

export function bindSupabaseAuthRefresh() {
  if (!supabase || Platform.OS === 'web') return () => undefined;

  const handleAppState = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  handleAppState(AppState.currentState);
  const subscription = AppState.addEventListener('change', handleAppState);

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
