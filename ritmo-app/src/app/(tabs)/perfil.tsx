// Pantalla 08 · Perfil / Configuración (+ funcionalidad móvil: cámara para la foto)
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/graficos';
import { avisar, BarraProgreso, confirmar, Etiqueta, FilaMenu, Pantalla, Tarjeta } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { useSesion } from '@/context/Sesion';
import { actualizarMiPerfil, cerrarSesion, generarDatosDemo, subirAvatar } from '@/lib/api';
import { mensajeError } from '@/lib/supabase';
import { colores, fuentes, radio } from '@/lib/tema';

export default function Perfil() {
  const { perfil, setPerfil, esAdmin } = useSesion();
  const { progreso, nivel, logros, recargar, hoy } = useDatos();
  const [subiendo, setSubiendo] = useState(false);
  if (!perfil) return null;
  const desbloqueados = logros.filter((l) => l.completado).length;

  const elegirFoto = async (origen: 'camara' | 'galeria') => {
    try {
      let resultado: ImagePicker.ImagePickerResult;
      const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 };
      if (origen === 'camara') {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) return avisar('Permiso necesario', 'Activa el permiso de cámara para tomar tu foto de perfil.');
        resultado = await ImagePicker.launchCameraAsync({ ...opciones, cameraType: ImagePicker.CameraType.front });
      } else {
        resultado = await ImagePicker.launchImageLibraryAsync(opciones);
      }
      if (resultado.canceled || !resultado.assets[0]) return;
      setSubiendo(true);
      const a = resultado.assets[0];
      const url = await subirAvatar(perfil.id, a.uri, a.mimeType ?? 'image/jpeg');
      setPerfil(await actualizarMiPerfil(perfil.id, { avatar_url: url }));
    } catch (e) {
      avisar('No se pudo actualizar la foto', mensajeError(e));
    } finally {
      setSubiendo(false);
    }
  };

  const cambiarFoto = () => {
    if (Platform.OS === 'web') return elegirFoto('galeria');
    Alert.alert('Foto de perfil', '¿De dónde quieres tomar la foto?', [
      { text: 'Cámara', onPress: () => elegirFoto('camara') },
      { text: 'Galería', onPress: () => elegirFoto('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const demo = async () => {
    const ok = await confirmar('Cargar datos de demostración', 'Se crearán tareas de ejemplo y 2 semanas de historial para ver rachas, estadísticas y logros.', 'Cargar');
    if (!ok) return;
    try {
      await generarDatosDemo(hoy);
      await recargar();
      avisar('¡Listo!', 'Ya tienes historial de ejemplo.');
    } catch (e) {
      avisar('Error', mensajeError(e));
    }
  };

  const salir = async () => {
    if (!(await confirmar('Cerrar sesión', '¿Seguro que quieres salir?', 'Cerrar sesión'))) return;
    await cerrarSesion();
    router.replace('/bienvenida');
  };

  return (
    <Pantalla>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Pressable accessibilityLabel="Cambiar foto de perfil" onPress={cambiarFoto}>
          <Avatar url={perfil.avatar_url} nombre={perfil.nombre} tam={104} />
          <View style={s.camara}>{subiendo ? <ActivityIndicator size="small" color={colores.verdeProfundo} /> : <Ionicons name="camera" size={18} color={colores.verdeProfundo} />}</View>
        </Pressable>
        <Text style={s.nombre}>{perfil.nombre}</Text>
        <Text style={s.email}>{perfil.email}</Text>
        {esAdmin && (
          <View style={{ marginTop: 8 }}>
            <Etiqueta texto="Administrador" color={colores.verdeProfundo} fondo={colores.amarillo} icono="shield-checkmark" />
          </View>
        )}
      </View>

      <Tarjeta style={{ marginTop: 20 }} onPress={() => router.push('/logros')}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.nivel}>
            Nivel {nivel.nivel.numero} · {nivel.nivel.nombre}
          </Text>
          <Text style={s.xp}>{nivel.siguiente ? `${progreso.puntosTotales} / ${nivel.meta} XP` : `${progreso.puntosTotales} XP`}</Text>
        </View>
        <BarraProgreso valor={nivel.avance} color={colores.amarillo} fondo={colores.amarilloSuave} />
        <View style={s.stats}>
          <Stat valor={`🔥 ${progreso.rachaActual}`} etiqueta="Racha" />
          <Stat valor={`⭐ ${progreso.puntosTotales}`} etiqueta="Puntos" />
          <Stat valor={`🏅 ${desbloqueados}/${logros.length}`} etiqueta="Logros" />
        </View>
      </Tarjeta>

      <Tarjeta style={{ marginTop: 14, paddingVertical: 8 }}>
        <FilaMenu icono="checkbox-outline" texto="Mis tareas" onPress={() => router.push('/(tabs)/tareas')} />
        <FilaMenu icono="flame-outline" texto="Constancia y racha" onPress={() => router.push('/racha')} />
        <FilaMenu icono="ribbon-outline" texto="Logros" onPress={() => router.push('/logros')} />
        <FilaMenu icono="notifications-outline" texto="Recordatorios" onPress={() => router.push('/recordatorios')} />
        <FilaMenu icono="settings-outline" texto="Configuración de la cuenta" onPress={() => router.push('/editar-perfil')} />
      </Tarjeta>

      <Tarjeta style={{ marginTop: 14, paddingVertical: 8 }}>
        <FilaMenu icono="sparkles-outline" texto="Cargar datos de demostración" onPress={demo} />
        <FilaMenu icono="help-circle-outline" texto="Ayuda y soporte" onPress={() => router.push('/ayuda')} />
        <FilaMenu icono="log-out-outline" texto="Cerrar sesión" onPress={salir} peligro />
      </Tarjeta>
      <Text style={s.version}>RITMO v1.0 · Tu constancia también se mide.</Text>
    </Pantalla>
  );
}

function Stat({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={s.statValor}>{valor}</Text>
      <Text style={s.statEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  camara: { position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colores.verde, borderWidth: 3, borderColor: colores.crema, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fuentes.extra, fontSize: 22, color: colores.texto, marginTop: 12 },
  email: { fontFamily: fuentes.media, fontSize: 13, color: colores.gris },
  nivel: { fontFamily: fuentes.bold, fontSize: 15, color: colores.texto },
  xp: { fontFamily: fuentes.bold, fontSize: 12, color: colores.gris },
  stats: { flexDirection: 'row', marginTop: 16, backgroundColor: colores.crema, borderRadius: radio.m, paddingVertical: 12 },
  statValor: { fontFamily: fuentes.extra, fontSize: 16, color: colores.texto },
  statEtiqueta: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris, marginTop: 2 },
  version: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris, textAlign: 'center', marginTop: 22 },
});
