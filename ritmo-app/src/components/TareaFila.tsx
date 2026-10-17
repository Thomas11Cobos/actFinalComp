import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { horaCorta } from '@/lib/fechas';
import { categorias, colores, fuentes, radio, sombra } from '@/lib/tema';
import type { Tarea } from '@/lib/tipos';
import type { IconName } from './ui';

export function TareaFila({
  tarea,
  hecha,
  onAlternar,
  onAbrir,
}: {
  tarea: Tarea;
  hecha: boolean;
  onAlternar?: () => void;
  onAbrir: () => void;
}) {
  const escala = useRef(new Animated.Value(1)).current;
  const cat = categorias[tarea.categoria];

  const alternar = () => {
    if (!onAlternar) return;
    // Funcionalidad móvil: respuesta háptica (vibración) al completar
    if (Platform.OS !== 'web') Haptics.notificationAsync(hecha ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.8, duration: 90, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onAlternar();
  };

  return (
    <Pressable onPress={onAbrir} style={({ pressed }) => [s.fila, hecha && s.filaHecha, pressed && { opacity: 0.9 }]}>
      {onAlternar && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hecha }}
          accessibilityLabel={`Marcar ${tarea.nombre}`}
          hitSlop={10}
          onPress={alternar}
        >
          <Animated.View style={[s.check, hecha && s.checkHecho, { transform: [{ scale: escala }] }]}>
            {hecha && <Ionicons name="checkmark" size={18} color={colores.blanco} />}
          </Animated.View>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[s.nombre, hecha && s.nombreHecho]}>
          {tarea.nombre}
        </Text>
        <View style={s.meta}>
          <Ionicons name={cat.icono as IconName} size={13} color={cat.color} />
          <Text style={[s.metaTexto, { color: cat.color }]}>{tarea.categoria}</Text>
          {tarea.duracion_min ? <Text style={s.metaTexto}>· {tarea.duracion_min} min</Text> : null}
          {tarea.hora_recordatorio ? <Text style={s.metaTexto}>· {horaCorta(tarea.hora_recordatorio)}</Text> : null}
        </View>
      </View>
      <View style={[s.puntos, hecha && { backgroundColor: colores.amarilloSuave }]}>
        <Text style={[s.puntosTexto, hecha && { color: '#B58612' }]}>+{tarea.puntos}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colores.blanco,
    borderRadius: radio.m,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...sombra,
  },
  filaHecha: { backgroundColor: '#FBFDFA' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CFCFC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHecho: { backgroundColor: colores.verde, borderColor: colores.verde },
  nombre: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  nombreHecho: { color: colores.gris, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaTexto: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  puntos: { backgroundColor: colores.verdeSuave, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  puntosTexto: { fontFamily: fuentes.extra, fontSize: 13, color: colores.verdeOscuro },
});
