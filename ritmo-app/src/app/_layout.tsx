import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ModalRecompensa } from '@/components/ModalRecompensa';
import { DatosProvider } from '@/context/Datos';
import { SesionProvider } from '@/context/Sesion';
import { supabaseConfigurado } from '@/lib/supabase';
import { colores } from '@/lib/tema';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fuentesListas] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  if (!supabaseConfigurado) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colores.verdeProfundo }}>
        <Text style={{ color: colores.blanco, fontSize: 18, textAlign: 'center' }}>
          Falta configurar Supabase. Crea el archivo .env con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SesionProvider>
        <DatosProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.crema }, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="bienvenida" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="tarea/nueva" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          <ModalRecompensa />
        </DatosProvider>
      </SesionProvider>
    </SafeAreaProvider>
  );
}
