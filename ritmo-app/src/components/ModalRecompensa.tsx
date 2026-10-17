// Pantalla 04 · Tarea completada (modal de recompensa, nivel y logros)
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useDatos } from '@/context/Datos';
import { BONO_DIA_COMPLETO } from '@/lib/progreso';
import { colores, fuentes, radio } from '@/lib/tema';
import { Confeti, Medalla } from './graficos';
import { Boton } from './ui';

export function ModalRecompensa() {
  const { celebracion: c, cerrarCelebracion } = useDatos();
  const { width } = useWindowDimensions();
  const entrada = useRef(new Animated.Value(0)).current;
  const contador = useRef(new Animated.Value(0)).current;
  const [mostrados, setMostrados] = useState(0);

  useEffect(() => {
    if (!c) return;
    entrada.setValue(0);
    contador.setValue(0);
    Animated.spring(entrada, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    Animated.timing(contador, { toValue: c.puntos, duration: 700, useNativeDriver: false }).start();
    const id = contador.addListener(({ value }) => setMostrados(Math.round(value)));
    return () => contador.removeListener(id);
  }, [c, entrada, contador]);

  if (!c) return null;
  const subioNivel = !!c.nuevoNivel;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={cerrarCelebracion}>
      <View style={s.fondo}>
        <Confeti ancho={width} cantidad={subioNivel ? 60 : 36} />
        <Animated.View
          style={[
            s.tarjeta,
            { opacity: entrada, transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
          ]}
        >
          <View style={[s.icono, subioNivel && { backgroundColor: colores.amarillo }]}>
            <Ionicons name={subioNivel ? 'trophy' : 'checkmark'} size={44} color={colores.verdeProfundo} />
          </View>
          <Text style={s.titulo}>{subioNivel ? '¡Has alcanzado un nuevo nivel!' : '¡Tarea completada!'}</Text>
          <Text style={s.subtitulo}>{subioNivel ? `Nivel ${c.nuevoNivel!.numero} · ${c.nuevoNivel!.nombre}` : c.tarea.nombre}</Text>

          <Text style={s.puntos}>+{mostrados}</Text>
          <Text style={s.puntosEtiqueta}>puntos</Text>
          {c.bonoDia && <Text style={s.bono}>🎉 ¡Completaste todo lo de hoy! Incluye +{BONO_DIA_COMPLETO} de bonificación</Text>}

          <View style={s.rachas}>
            <View style={s.racha}>
              <Text style={s.rachaValor}>🔥 {c.rachaActual}</Text>
              <Text style={s.rachaEtiqueta}>Racha actual</Text>
            </View>
            <View style={s.separador} />
            <View style={s.racha}>
              <Text style={s.rachaValor}>🏆 {c.mejorRacha}</Text>
              <Text style={s.rachaEtiqueta}>Mejor racha</Text>
            </View>
          </View>

          {c.nuevosLogros.map((l) => (
            <View key={l.id} style={s.logro}>
              <Medalla icono={l.icono} activa tam={42} />
              <View style={{ flex: 1 }}>
                <Text style={s.logroTitulo}>¡Nuevo logro desbloqueado!</Text>
                <Text style={s.logroNombre}>{l.nombre}</Text>
              </View>
            </View>
          ))}

          <Boton titulo="Continuar" onPress={cerrarCelebracion} style={{ alignSelf: 'stretch', marginTop: 18 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(16,37,26,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  tarjeta: { width: '100%', maxWidth: 380, backgroundColor: colores.blanco, borderRadius: radio.xl, padding: 26, alignItems: 'center' },
  icono: { width: 86, height: 86, borderRadius: 43, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  titulo: { fontFamily: fuentes.extra, fontSize: 22, color: colores.texto, textAlign: 'center' },
  subtitulo: { fontFamily: fuentes.semi, fontSize: 15, color: colores.gris, marginTop: 4, textAlign: 'center' },
  puntos: { fontFamily: fuentes.extra, fontSize: 52, color: colores.verdeOscuro, marginTop: 14, letterSpacing: -1 },
  puntosEtiqueta: { fontFamily: fuentes.semi, fontSize: 13, color: colores.gris, marginTop: -6 },
  bono: { fontFamily: fuentes.semi, fontSize: 13, color: '#9A6F07', backgroundColor: colores.amarilloSuave, padding: 10, borderRadius: 12, marginTop: 12, textAlign: 'center' },
  rachas: { flexDirection: 'row', backgroundColor: colores.crema, borderRadius: radio.m, marginTop: 18, paddingVertical: 12, alignSelf: 'stretch' },
  racha: { flex: 1, alignItems: 'center' },
  rachaValor: { fontFamily: fuentes.extra, fontSize: 20, color: colores.texto },
  rachaEtiqueta: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris, marginTop: 2 },
  separador: { width: 1, backgroundColor: colores.grisClaro },
  logro: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', backgroundColor: colores.amarilloSuave, borderRadius: radio.m, padding: 12, marginTop: 12 },
  logroTitulo: { fontFamily: fuentes.semi, fontSize: 12, color: '#9A6F07' },
  logroNombre: { fontFamily: fuentes.extra, fontSize: 16, color: colores.texto },
});
