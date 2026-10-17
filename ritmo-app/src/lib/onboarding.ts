import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'ritmo.onboarding.';

export async function onboardingHecho(usuarioId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLAVE + usuarioId)) === 'hecho';
  } catch {
    return true;
  }
}

export async function marcarOnboarding(usuarioId: string) {
  await AsyncStorage.setItem(CLAVE + usuarioId, 'hecho');
}
