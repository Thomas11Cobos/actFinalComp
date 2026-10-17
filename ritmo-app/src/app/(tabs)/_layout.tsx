import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Cargando, type IconName } from '@/components/ui';
import { useSesion } from '@/context/Sesion';
import { colores, fuentes } from '@/lib/tema';

const icono =
  (activo: IconName, inactivo: IconName) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => <Ionicons name={focused ? activo : inactivo} size={24} color={color as string} />;

export default function TabsLayout() {
  const { cargando, sesion, esAdmin } = useSesion();
  if (cargando) return <Cargando />;
  if (!sesion) return <Redirect href="/bienvenida" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.verdeOscuro,
        tabBarInactiveTintColor: '#A3A39E',
        tabBarLabelStyle: { fontFamily: fuentes.semi, fontSize: 11 },
        tabBarStyle: { backgroundColor: colores.blanco, borderTopColor: '#EEEEEA', height: 64, paddingTop: 6, paddingBottom: 8 },
        sceneStyle: { backgroundColor: colores.crema },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('home', 'home-outline') }} />
      <Tabs.Screen name="tareas" options={{ title: 'Tareas', tabBarIcon: icono('checkbox', 'checkbox-outline') }} />
      <Tabs.Screen name="estadisticas" options={{ title: 'Estadísticas', tabBarIcon: icono('stats-chart', 'stats-chart-outline') }} />
      <Tabs.Screen name="usuarios" options={{ title: 'Usuarios', href: esAdmin ? undefined : null, tabBarIcon: icono('people', 'people-outline') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('person', 'person-outline') }} />
    </Tabs>
  );
}
