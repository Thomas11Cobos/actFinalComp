// Componentes reutilizables del sistema de diseño de RITMO.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colores, espacio, fuentes, radio, sombra } from '@/lib/tema';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Texto({
  children,
  v = 'cuerpo',
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  v?: 'titulo' | 'subtitulo' | 'cuerpo' | 'peque' | 'numero' | 'etiqueta' | 'gigante';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[estilosTexto[v], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

const estilosTexto = StyleSheet.create({
  gigante: { fontFamily: fuentes.extra, fontSize: 40, color: colores.texto, letterSpacing: -1 },
  titulo: { fontFamily: fuentes.bold, fontSize: 24, color: colores.texto, letterSpacing: -0.4 },
  subtitulo: { fontFamily: fuentes.semi, fontSize: 17, color: colores.texto },
  cuerpo: { fontFamily: fuentes.regular, fontSize: 15, color: colores.texto, lineHeight: 21 },
  peque: { fontFamily: fuentes.media, fontSize: 13, color: colores.gris },
  numero: { fontFamily: fuentes.extra, fontSize: 22, color: colores.texto },
  etiqueta: { fontFamily: fuentes.semi, fontSize: 12, color: colores.gris, letterSpacing: 0.6, textTransform: 'uppercase' },
});

export function Pantalla({
  children,
  scroll = true,
  fondo = colores.crema,
  padding = true,
  bordes = ['top'],
}: {
  children: ReactNode;
  scroll?: boolean;
  fondo?: string;
  padding?: boolean;
  bordes?: ('top' | 'bottom')[];
}) {
  const contenido = scroll ? (
    <ScrollView
      contentContainerStyle={[padding && { padding: espacio.xl, paddingBottom: 48 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padding && { padding: espacio.xl }]}>{children}</View>
  );
  return (
    <SafeAreaView edges={bordes} style={{ flex: 1, backgroundColor: fondo }}>
      {contenido}
    </SafeAreaView>
  );
}

export function Encabezado({ titulo, atras = true, derecha }: { titulo: string; atras?: boolean; derecha?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: espacio.xl, gap: espacio.m }}>
      {atras && (
        <Pressable
          accessibilityLabel="Volver"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={estilos.botonIcono}
        >
          <Ionicons name="chevron-back" size={22} color={colores.texto} />
        </Pressable>
      )}
      <Texto v="titulo" style={{ flex: 1 }} numberOfLines={1}>
        {titulo}
      </Texto>
      {derecha}
    </View>
  );
}

export function Tarjeta({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [estilos.tarjeta, style, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

export function Boton({
  titulo,
  onPress,
  tipo = 'primario',
  icono,
  cargando,
  deshabilitado,
  style,
}: {
  titulo: string;
  onPress: () => void;
  tipo?: 'primario' | 'secundario' | 'peligro' | 'claro' | 'texto';
  icono?: IconName;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fondos = { primario: colores.verde, secundario: colores.blanco, peligro: colores.rojoSuave, claro: 'rgba(255,255,255,0.12)', texto: 'transparent' };
  const textos = { primario: colores.verdeProfundo, secundario: colores.verdeOscuro, peligro: colores.rojo, claro: colores.blanco, texto: colores.verdeOscuro };
  const off = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondos[tipo] },
        tipo === 'secundario' && { borderWidth: 1.5, borderColor: colores.grisClaro },
        off && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={textos[tipo]} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={19} color={textos[tipo]} />}
          <Text style={[estilos.botonTexto, { color: textos[tipo] }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Campo({ etiqueta, error, icono, ...props }: TextInputProps & { etiqueta: string; error?: string | null; icono?: IconName }) {
  return (
    <View style={{ marginBottom: espacio.l }}>
      <Texto v="etiqueta" style={{ marginBottom: 6 }}>
        {etiqueta}
      </Texto>
      <View style={[estilos.campo, !!error && { borderColor: colores.rojo }]}>
        {icono && <Ionicons name={icono} size={18} color={colores.gris} />}
        <TextInput placeholderTextColor="#B0B0AA" style={estilos.campoInput} {...props} />
      </View>
      {!!error && (
        <Texto v="peque" color={colores.rojo} style={{ marginTop: 4 }}>
          {error}
        </Texto>
      )}
    </View>
  );
}

export function Chip({
  texto,
  activo,
  onPress,
  color = colores.verdeOscuro,
  fondo = colores.verdeSuave,
  icono,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
  color?: string;
  fondo?: string;
  icono?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[estilos.chip, activo ? { backgroundColor: fondo, borderColor: color } : null]}
    >
      {icono && <Ionicons name={icono} size={15} color={activo ? color : colores.gris} />}
      <Text style={[estilos.chipTexto, { color: activo ? color : '#5C5C58' }]}>{texto}</Text>
    </Pressable>
  );
}

export function Etiqueta({ texto, color, fondo, icono }: { texto: string; color: string; fondo: string; icono?: IconName }) {
  return (
    <View style={[estilos.etiqueta, { backgroundColor: fondo }]}>
      {icono && <Ionicons name={icono} size={12} color={color} />}
      <Text style={{ fontFamily: fuentes.semi, fontSize: 12, color }}>{texto}</Text>
    </View>
  );
}

export function FilaMenu({ icono, texto, onPress, derecha, peligro }: { icono: IconName; texto: string; onPress?: () => void; derecha?: ReactNode; peligro?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [estilos.filaMenu, pressed && { backgroundColor: '#F1F1EE' }]}>
      <View style={[estilos.iconoMenu, peligro && { backgroundColor: colores.rojoSuave }]}>
        <Ionicons name={icono} size={19} color={peligro ? colores.rojo : colores.verdeOscuro} />
      </View>
      <Texto v="subtitulo" style={{ flex: 1, fontSize: 15 }} color={peligro ? colores.rojo : colores.texto}>
        {texto}
      </Texto>
      {derecha ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colores.gris} />)}
    </Pressable>
  );
}

export function Interruptor({ valor, onCambio, deshabilitado }: { valor: boolean; onCambio: (v: boolean) => void; deshabilitado?: boolean }) {
  return (
    <Switch
      value={valor}
      onValueChange={onCambio}
      disabled={deshabilitado}
      trackColor={{ false: colores.grisClaro, true: colores.verde }}
      thumbColor={colores.blanco}
      ios_backgroundColor={colores.grisClaro}
    />
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono: IconName; titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 }}>
      <View style={estilos.vacioIcono}>
        <Ionicons name={icono} size={34} color={colores.verdeOscuro} />
      </View>
      <Texto v="subtitulo" style={{ textAlign: 'center', marginTop: 14 }}>
        {titulo}
      </Texto>
      <Texto v="peque" style={{ textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
        {texto}
      </Texto>
      {accion}
    </View>
  );
}

export function Cargando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.crema }}>
      <ActivityIndicator size="large" color={colores.verde} />
    </View>
  );
}

export function BarraProgreso({ valor, color = colores.verde, fondo = colores.grisClaro, alto = 10 }: { valor: number; color?: string; fondo?: string; alto?: number }) {
  return (
    <View style={{ height: alto, borderRadius: alto, backgroundColor: fondo, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, valor)) * 100)}%`, height: '100%', backgroundColor: color, borderRadius: alto }} />
    </View>
  );
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: espacio.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espacio.m }}>
        <Texto v="subtitulo">{titulo}</Texto>
        {accion}
      </View>
      {children}
    </View>
  );
}

/** Confirmación que funciona en el teléfono y en la web. */
export function confirmar(titulo: string, mensaje: string, textoOk = 'Eliminar'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise((res) =>
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => res(false) },
      { text: textoOk, style: 'destructive', onPress: () => res(true) },
    ]),
  );
}

export function avisar(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  else Alert.alert(titulo, mensaje);
}

export const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radio.l, padding: espacio.l, ...sombra },
  boton: {
    minHeight: 54,
    borderRadius: radio.m,
    paddingHorizontal: espacio.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: { fontFamily: fuentes.bold, fontSize: 16 },
  botonIcono: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colores.blanco,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colores.blanco,
    borderRadius: radio.m,
    borderWidth: 1.5,
    borderColor: colores.grisClaro,
    paddingHorizontal: 14,
  },
  campoInput: { flex: 1, minHeight: 52, fontFamily: fuentes.media, fontSize: 15, color: colores.texto },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radio.total,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: colores.grisClaro,
  },
  chipTexto: { fontFamily: fuentes.semi, fontSize: 14 },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radio.total, alignSelf: 'flex-start' },
  filaMenu: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12 },
  iconoMenu: { width: 38, height: 38, borderRadius: 12, backgroundColor: colores.verdeSuave, alignItems: 'center', justifyContent: 'center' },
  vacioIcono: { width: 76, height: 76, borderRadius: 38, backgroundColor: colores.verdeSuave, alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center' },
});
