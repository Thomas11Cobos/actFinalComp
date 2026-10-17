// Funcionalidad móvil 1: recordatorios con notificaciones locales.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Tarea } from './tipos';

export interface PrefsRecordatorios {
  activas: boolean;
  tareas: boolean;
  resumen: boolean;
  resumenHora: number; // hora del día (0-23)
  racha: boolean;
  rachaHora: number;
}

export const PREFS_INICIALES: PrefsRecordatorios = {
  activas: true,
  tareas: true,
  resumen: true,
  resumenHora: 7,
  racha: true,
  rachaHora: 20,
};

const CLAVE = 'ritmo.recordatorios';
const CANAL = 'recordatorios';
export const notificacionesDisponibles = Platform.OS !== 'web';

if (notificacionesDisponibles) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function leerPrefs(): Promise<PrefsRecordatorios> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE);
    return raw ? { ...PREFS_INICIALES, ...JSON.parse(raw) } : PREFS_INICIALES;
  } catch {
    return PREFS_INICIALES;
  }
}

export async function guardarPrefs(p: PrefsRecordatorios) {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(p));
}

export async function pedirPermiso(): Promise<boolean> {
  if (!notificacionesDisponibles) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de RITMO',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#72C267',
      vibrationPattern: [0, 200, 120, 200],
    });
  }
  const actual = await Notifications.getPermissionsAsync();
  if (actual.status === 'granted') return true;
  const nuevo = await Notifications.requestPermissionsAsync();
  return nuevo.status === 'granted';
}

function horaMin(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  return { hour: h, minute: m };
}

/** Borra y vuelve a programar todos los recordatorios según las tareas y las preferencias. */
export async function reprogramar(tareas: Tarea[], prefs: PrefsRecordatorios): Promise<number> {
  if (!notificacionesDisponibles) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.activas) return 0;
  if (!(await pedirPermiso())) return 0;

  const T = Notifications.SchedulableTriggerInputTypes;
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};
  let n = 0;
  const programar = async (title: string, body: string, trigger: Notifications.SchedulableNotificationTriggerInput) => {
    await Notifications.scheduleNotificationAsync({ content: { title, body, sound: true }, trigger });
    n++;
  };

  if (prefs.tareas) {
    for (const t of tareas) {
      if (!t.hora_recordatorio) continue;
      const { hour, minute } = horaMin(t.hora_recordatorio);
      const titulo = `⏰ ${t.nombre}`;
      const cuerpo = `Es hora de mantener tu ritmo. +${t.puntos} puntos te esperan.`;
      if (t.frecuencia === 'diaria') {
        await programar(titulo, cuerpo, { type: T.DAILY, hour, minute, ...canal });
      } else if (t.frecuencia === 'semanal') {
        for (const d of t.dias) await programar(titulo, cuerpo, { type: T.WEEKLY, weekday: d + 1, hour, minute, ...canal });
      } else if (t.fecha) {
        const [a, m, d] = t.fecha.split('-').map(Number);
        const cuando = new Date(a, m - 1, d, hour, minute);
        if (cuando > new Date()) await programar(titulo, cuerpo, { type: T.DATE, date: cuando, ...canal });
      }
    }
  }
  if (prefs.resumen) {
    await programar('☀️ Tu día en RITMO', 'Revisa tus tareas de hoy y empieza con buen ritmo.', {
      type: T.DAILY,
      hour: prefs.resumenHora,
      minute: 0,
      ...canal,
    });
  }
  if (prefs.racha) {
    await programar('🔥 No pierdas tu racha', 'Aún puedes completar tus tareas de hoy.', {
      type: T.DAILY,
      hour: prefs.rachaHora,
      minute: 0,
      ...canal,
    });
  }
  return n;
}

export async function enviarPrueba() {
  if (!(await pedirPermiso())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: '¡Así se verán tus recordatorios!', body: 'Pequeños hábitos. Grandes resultados.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, ...(Platform.OS === 'android' ? { channelId: CANAL } : {}) },
  });
  return true;
}
