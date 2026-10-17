// Pantalla 05 · Constancia / Racha (calendario mensual + comodín)
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Encabezado, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { useSesion } from '@/context/Sesion';
import { aISO, DIAS_CORTOS, MESES, sumarDias } from '@/lib/fechas';
import type { EstadoDia } from '@/lib/progreso';
import { colores, fuentes, radio } from '@/lib/tema';

const COLOR_ESTADO: Record<EstadoDia, { fondo: string; texto: string }> = {
  perfecto: { fondo: colores.verdeOscuro, texto: colores.blanco },
  cumplido: { fondo: colores.verdeOscuro, texto: colores.blanco },
  parcial: { fondo: '#C5E8BF', texto: colores.verdeOscuro },
  sin: { fondo: '#ECECE8', texto: colores.gris },
  comodin: { fondo: colores.amarillo, texto: colores.verdeProfundo },
  libre: { fondo: 'transparent', texto: '#BDBDB8' },
  pendiente: { fondo: colores.blanco, texto: colores.texto },
};

export default function Racha() {
  const { progreso, hoy } = useDatos();
  const { perfil } = useSesion();
  const base = new Date();
  const [mes, setMes] = useState({ a: base.getFullYear(), m: base.getMonth() });

  const primero = new Date(mes.a, mes.m, 1);
  const diasMes = new Date(mes.a, mes.m + 1, 0).getDate();
  const offset = (primero.getDay() + 6) % 7; // semana empieza en lunes
  const celdas: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => aISO(new Date(mes.a, mes.m, i + 1)))];
  while (celdas.length % 7) celdas.push(null);

  const cambiarMes = (d: number) => {
    const n = new Date(mes.a, mes.m + d, 1);
    setMes({ a: n.getFullYear(), m: n.getMonth() });
  };
  const esMesActual = mes.a === base.getFullYear() && mes.m === base.getMonth();

  const ultimos7 = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i - 6));

  return (
    <Pantalla>
      <Encabezado titulo="Constancia" />

      <View style={s.heroe}>
        <Text style={{ fontSize: 46 }}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroeValor}>{progreso.rachaActual} días</Text>
          <Text style={s.heroeTexto}>{progreso.rachaActual > 0 ? `¡Llevas ${progreso.rachaActual} días seguidos!` : 'Hoy es un gran día para empezar.'}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Tarjeta style={{ flex: 1 }}>
          <Text style={s.kpiValor}>🏆 {progreso.mejorRacha}</Text>
          <Text style={s.kpiEtiqueta}>Récord histórico</Text>
        </Tarjeta>
        <Tarjeta style={{ flex: 1 }}>
          <Text style={s.kpiValor}>{progreso.comodinDisponible ? '🛟 1' : '🛟 0'}</Text>
          <Text style={s.kpiEtiqueta}>{progreso.comodinDisponible ? 'Comodín disponible' : 'Comodín usado este mes'}</Text>
        </Tarjeta>
      </View>

      <Tarjeta style={{ marginTop: 14 }}>
        <View style={s.mesFila}>
          <Pressable accessibilityLabel="Mes anterior" onPress={() => cambiarMes(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colores.texto} />
          </Pressable>
          <Text style={s.mes}>
            {MESES[mes.m][0].toUpperCase() + MESES[mes.m].slice(1)} {mes.a}
          </Text>
          <Pressable accessibilityLabel="Mes siguiente" onPress={() => !esMesActual && cambiarMes(1)} hitSlop={10} style={{ opacity: esMesActual ? 0.25 : 1 }}>
            <Ionicons name="chevron-forward" size={22} color={colores.texto} />
          </Pressable>
        </View>
        <View style={s.semana}>
          {[1, 2, 3, 4, 5, 6, 0].map((d, i) => (
            <Text key={i} style={s.diaSemana}>
              {DIAS_CORTOS[d]}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {celdas.map((f, i) => {
            if (!f) return <View key={i} style={s.celda} />;
            const dia = progreso.porFecha[f];
            const estado: EstadoDia = f > hoy ? 'libre' : (dia?.estado ?? 'libre');
            const c = COLOR_ESTADO[estado];
            return (
              <View key={i} style={s.celda}>
                <View style={[s.circulo, { backgroundColor: c.fondo }, f === hoy && s.hoy]}>
                  <Text style={[s.numero, { color: c.texto }]}>{Number(f.slice(8))}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={s.leyenda}>
          <Leyenda color={colores.verdeOscuro} texto="Meta cumplida" />
          <Leyenda color="#C5E8BF" texto="Incompleto" />
          <Leyenda color="#ECECE8" texto="Sin actividad" />
          <Leyenda color={colores.amarillo} texto="Comodín" />
        </View>
      </Tarjeta>

      <Tarjeta style={{ marginTop: 14 }}>
        <Texto v="subtitulo" style={{ marginBottom: 4 }}>
          Cumplimiento semanal
        </Texto>
        <Texto v="peque" style={{ marginBottom: 14 }}>
          Tu meta diaria: {perfil?.meta_diaria ?? 50}% de las tareas programadas
        </Texto>
        <View style={s.barras}>
          {ultimos7.map((f) => {
            const d = progreso.porFecha[f];
            const pct = d ? d.pct : 0;
            const ok = d && (d.estado === 'cumplido' || d.estado === 'perfecto');
            return (
              <View key={f} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={s.barraPct}>{d && d.programadas ? `${Math.round(pct * 100)}` : '–'}</Text>
                <View style={s.barraFondo}>
                  <View style={[s.barra, { height: `${Math.max(4, pct * 100)}%`, backgroundColor: ok ? colores.verde : '#C5E8BF' }]} />
                </View>
                <Text style={[s.barraDia, f === hoy && { color: colores.verdeOscuro, fontFamily: fuentes.extra }]}>{DIAS_CORTOS[new Date(f + 'T12:00').getDay()]}</Text>
              </View>
            );
          })}
        </View>
      </Tarjeta>

      <View style={s.nota}>
        <Ionicons name="information-circle-outline" size={18} color={colores.verdeOscuro} />
        <Text style={s.notaTexto}>
          La racha sube cada día que alcanzas tu meta. Si un día no la alcanzas, el comodín del mes la protege; si ya lo usaste, la racha vuelve a cero, pero tu récord se conserva.
        </Text>
      </View>
    </Pantalla>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontFamily: fuentes.media, fontSize: 11, color: colores.gris }}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  heroe: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colores.verdeProfundo, borderRadius: radio.xl, padding: 20 },
  heroeValor: { fontFamily: fuentes.extra, fontSize: 32, color: colores.blanco },
  heroeTexto: { fontFamily: fuentes.media, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  kpiValor: { fontFamily: fuentes.extra, fontSize: 20, color: colores.texto },
  kpiEtiqueta: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris, marginTop: 2 },
  mesFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  mes: { fontFamily: fuentes.bold, fontSize: 16, color: colores.texto },
  semana: { flexDirection: 'row' },
  diaSemana: { flex: 1, textAlign: 'center', fontFamily: fuentes.semi, fontSize: 12, color: colores.gris, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: '82%', height: '82%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  hoy: { borderWidth: 2, borderColor: colores.verde },
  numero: { fontFamily: fuentes.bold, fontSize: 13 },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' },
  barras: { flexDirection: 'row', height: 150, gap: 6 },
  barraPct: { fontFamily: fuentes.semi, fontSize: 10, color: colores.gris, marginBottom: 4 },
  barraFondo: { flex: 1, width: 22, backgroundColor: '#F1F1EE', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barra: { width: '100%', borderRadius: 8 },
  barraDia: { fontFamily: fuentes.semi, fontSize: 12, color: colores.gris, marginTop: 6 },
  nota: { flexDirection: 'row', gap: 10, backgroundColor: colores.verdeSuave, borderRadius: radio.m, padding: 14, marginTop: 14 },
  notaTexto: { flex: 1, fontFamily: fuentes.media, fontSize: 12, color: colores.verdeOscuro, lineHeight: 17 },
});
