import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Cargando } from '@/components/ui';
import { useSesion } from '@/context/Sesion';
import { onboardingHecho } from '@/lib/onboarding';

/** Decide a dónde ir al abrir la app. */
export default function Inicio() {
  const { cargando, sesion, perfil } = useSesion();
  const [onboarding, setOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!perfil) return;
    onboardingHecho(perfil.id).then(setOnboarding);
  }, [perfil]);

  if (cargando) return <Cargando />;
  if (!sesion) return <Redirect href="/bienvenida" />;
  if (!perfil || onboarding === null) return <Cargando />;
  if (!onboarding && perfil.rol !== 'admin') return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
