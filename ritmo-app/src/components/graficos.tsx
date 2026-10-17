import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colores, fuentes } from '@/lib/tema';
import type { IconName } from './ui';

/** Logo: montaña con ruta ascendente y bandera. */
export function Logo({ tam = 96, claro = false }: { tam?: number; claro?: boolean }) {
  const fondo = claro ? 'rgba(114,194,103,0.14)' : colores.verdeSuave;
  return (
    <Svg width={tam} height={tam} viewBox="0 0 100 100">
      <Rect x="0" y="0" width="100" height="100" rx="28" fill={fondo} />
      <Polygon points="14,80 44,34 58,54 66,44 88,80" fill={colores.verde} />
      <Polygon points="44,34 52,46 47,52 40,46" fill={claro ? '#C9EBC3' : '#FFFFFF'} opacity={0.9} />
      <Path d="M26 80 C 40 70, 48 66, 56 58 S 66 46, 66 44" stroke={colores.amarillo} strokeWidth={4} strokeLinecap="round" fill="none" strokeDasharray="1 7" />
      <Line x1="66" y1="44" x2="66" y2="18" stroke={claro ? '#FFFFFF' : colores.verdeProfundo} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M66 18 L82 23 L66 29 Z" fill={colores.amarillo} />
    </Svg>
  );
}

/** Anillo de progreso animado. */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function Anillo({
  valor,
  tam = 120,
  grosor = 12,
  color = colores.verde,
  fondo = 'rgba(255,255,255,0.18)',
  children,
}: {
  valor: number;
  tam?: number;
  grosor?: number;
  color?: string;
  fondo?: string;
  children?: React.ReactNode;
}) {
  const r = (tam - grosor) / 2;
  const c = 2 * Math.PI * r;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, valor)), duration: 700, useNativeDriver: false }).start();
  }, [valor, anim]);
  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });
  return (
    <View style={{ width: tam, height: tam, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tam} height={tam} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={tam / 2} cy={tam / 2} r={r} stroke={fondo} strokeWidth={grosor} fill="none" />
        <AnimatedCircle
          cx={tam / 2}
          cy={tam / 2}
          r={r}
          stroke={color}
          strokeWidth={grosor}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Gráfica de líneas con área (puntos por día). */
export function GraficaLineas({ datos, ancho, alto = 170, etiquetas }: { datos: number[]; ancho: number; alto?: number; etiquetas: string[] }) {
  const pad = { izq: 30, der: 10, arr: 14, aba: 24 };
  const w = ancho - pad.izq - pad.der;
  const h = alto - pad.arr - pad.aba;
  const max = Math.max(10, ...datos);
  const paso = datos.length > 1 ? w / (datos.length - 1) : 0;
  const pts = datos.map((v, i) => [pad.izq + i * paso, pad.arr + h - (v / max) * h] as const);
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = pts.length ? `${linea} L${pts[pts.length - 1][0]},${pad.arr + h} L${pts[0][0]},${pad.arr + h} Z` : '';
  const marcas = [0, 0.5, 1].map((f) => Math.round(max * f));
  const cadaN = Math.max(1, Math.ceil(datos.length / 7));
  return (
    <Svg width={ancho} height={alto}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colores.verde} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colores.verde} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {marcas.map((m) => {
        const y = pad.arr + h - (m / max) * h;
        return (
          <G key={m}>
            <Line x1={pad.izq} x2={ancho - pad.der} y1={y} y2={y} stroke={colores.grisClaro} strokeWidth={1} />
            <SvgText x={pad.izq - 6} y={y + 4} fontSize={10} fill={colores.gris} textAnchor="end" fontFamily={fuentes.media}>
              {m}
            </SvgText>
          </G>
        );
      })}
      {area ? <Path d={area} fill="url(#area)" /> : null}
      {linea ? <Path d={linea} stroke={colores.verdeOscuro} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {pts.length <= 31 &&
        pts.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={datos.length <= 7 ? 4 : 2.5} fill={colores.blanco} stroke={colores.verdeOscuro} strokeWidth={2} />)}
      {etiquetas.map((e, i) =>
        i % cadaN === 0 || i === etiquetas.length - 1 ? (
          <SvgText key={i} x={pad.izq + i * paso} y={alto - 6} fontSize={10} fill={colores.gris} textAnchor="middle" fontFamily={fuentes.media}>
            {e}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

/** Foto de perfil o iniciales. */
export function Avatar({ url, nombre, tam = 56 }: { url?: string | null; nombre: string; tam?: number }) {
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  if (url) return <Image source={{ uri: url }} style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: colores.verdeSuave }} />;
  return (
    <View style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fuentes.extra, fontSize: tam * 0.36, color: colores.verdeProfundo }}>{iniciales || '?'}</Text>
    </View>
  );
}

/** Medalla de logro. */
export function Medalla({ icono, activa, tam = 56 }: { icono: string; activa: boolean; tam?: number }) {
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: activa ? colores.amarillo : '#EFEFEB',
        borderWidth: 3,
        borderColor: activa ? '#FBE3A4' : '#E2E2DD',
      }}
    >
      <Ionicons name={icono as IconName} size={tam * 0.45} color={activa ? colores.verdeProfundo : '#B4B4AE'} />
    </View>
  );
}

/** Lluvia de confeti sencilla con Animated. */
const COLORES_CONFETI = [colores.verde, colores.amarillo, '#5B8DEF', '#E07A5F', colores.blanco];
export function Confeti({ ancho, cantidad = 36 }: { ancho: number; cantidad?: number }) {
  const piezas = useRef(
    Array.from({ length: cantidad }, (_, i) => ({
      x: Math.random() * ancho,
      tam: 6 + Math.random() * 6,
      color: COLORES_CONFETI[i % COLORES_CONFETI.length],
      giro: Math.random() * 360,
      retraso: Math.random() * 400,
      anim: new Animated.Value(0),
    })),
  ).current;
  useEffect(() => {
    Animated.parallel(
      piezas.map((p) => Animated.timing(p.anim, { toValue: 1, duration: 1800 + Math.random() * 800, delay: p.retraso, useNativeDriver: true })),
    ).start();
  }, [piezas]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {piezas.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.tam,
            height: p.tam * 1.6,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, 620] }) },
              { translateX: p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, i % 2 ? 24 : -24, 0] }) },
              { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: [`${p.giro}deg`, `${p.giro + 540}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
