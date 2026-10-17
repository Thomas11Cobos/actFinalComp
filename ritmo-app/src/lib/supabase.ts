import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigurado = url.startsWith('http') && anonKey.length > 20;

export const supabase = createClient(supabaseConfigurado ? url : 'http://localhost', supabaseConfigurado ? anonKey : 'sin-configurar', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresca la sesión solo mientras la app está en primer plano (recomendación de Supabase para móviles).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Traduce los errores más comunes de Supabase al español. */
export function mensajeError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  const mapa: [RegExp, string][] = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/user already registered|already been registered/i, 'Ya existe una cuenta con ese correo.'],
    [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/email not confirmed/i, 'Debes confirmar tu correo antes de entrar.'],
    [/user is banned/i, 'Tu cuenta está desactivada. Habla con el administrador.'],
    [/unable to validate email|invalid format|email address .* is invalid/i, 'El correo no es válido.'],
    [/network request failed|failed to fetch/i, 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'],
    [/rate limit/i, 'Demasiados intentos. Espera un momento.'],
  ];
  for (const [re, txt] of mapa) if (re.test(msg)) return txt;
  return msg;
}
