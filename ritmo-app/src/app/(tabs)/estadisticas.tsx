// Pantalla 06 · Estadísticas (+ mejora: resumen semanal)
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GraficaLineas } from '@/components/graficos';
import { BarraProgreso, Chip, Pantalla, Seccion, Tarjeta, Texto, type IconName } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { DIAS_CORTOS, DIAS_NOMBRE, desdeISO } from '@/lib/fechas';
import { calcularEstadisticas, type Periodo } from '@/lib/progreso';
import { categorias, colores, fuentes, radio } from '@/lib/tema';
import { CATEGORIAS, type Categoria } from '@/lib/tipos';

function horas(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function Estadisticas() {
  const { progreso, cumplimientos, hoy } = useDatos();
  const { width } = useWindowDimensions();
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const e = useMemo(() => calcularEstadisticas(progreso, cumplimientos, periodo, hoy), [progreso, cumplimientos, periodo, hoy]);
  const semana = useMemo(() => calcularEstadisticas(progreso, cumplimientos, 'semana', hoy), [progreso, cumplimientos, hoy]);

  const etiquetas = e.serie.map((x) => (periodo === 'semana' ? DIAS_CORTOS[desdeISO(x.fecha).getDay()] : String(desdeISO(x.fecha).getDate())));
  const totalCat = Math.max(1, ...Object.values(e.porCategoria));
  const mejorCategoria = (Object.entries(semana.porCategoria) as [Categoria, number][]).sort((a, b) => b[1] - a[1])[0];
  const anchoGrafica = Math.min(width, 520) - 40 - 32;

  let mensajeSemana = 'Cada pequeño paso cuenta. Esta semana es una nueva oportunidad.';
  if (semana.variacion !== null && semana.variacion > 0) mensajeSemana = `¡Sumaste ${semana.variacion}% más puntos que la semana pasada!`;
  else if (semana.diasCumplidos >= 5) mensajeSemana = 'Semana muy constante. Tu ritmo se nota.';
  else if (semana.completadas > 0) mensajeSemana = 'Vas avanzando. Mañana tienes otra oportunidad para avanzar.';

  return (
    <Pantalla>
      <Texto v="titulo">Estadísticas</Texto>
      <Texto v="peque" style={{ marginBottom: 16 }}>
        Tu evolución, calculada con tu historial real.
      </Texto>

      {/* Resumen semanal */}
      <View style={s.resumen}>
        <Text style={s.resumenEtiqueta}>TU SEMANA EN RITMO</Text>
        <Text style={s.resumenMensaje}>{mensajeSemana}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={s.resumenDato}>
            <Text style={s.resumenValor}>{semana.mejorDia ? DIAS_NOMBRE[desdeISO(semana.mejorDia.fecha).getDay()] : '—'}</Text>
            <Text style={s.resumenSub}>Mejor día</Text>
          </View>
          <View style={s.resumenDato}>
            <Text style={s.resumenValor}>{mejorCategoria && mejorCategoria[1] > 0 ? mejorCategoria[0] : '—'}</Text>
            <Text style={s.resumenSub}>Categoría más fuerte</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        <Chip texto="Semana" activo={periodo === 'semana'} onPress={() => setPeriodo('semana')} />
        <Chip texto="Mes" activo={periodo === 'mes'} onPress={() => setPeriodo('mes')} />
        <Chip texto="Todo el tiempo" activo={periodo === 'todo'} onPress={() => setPeriodo('todo')} />
      </View>

      <Tarjeta style={{ marginTop: 14 }}>
        <Texto v="etiqueta">Puntuación del periodo</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
          <Texto v="gigante">{e.puntos.toLocaleString('es-CO')}</Texto>
          {e.variacion !== null && (
            <View style={[s.variacion, { backgroundColor: e.variacion >= 0 ? colores.verdeSuave : colores.rojoSuave }]}>
              <Ionicons name={e.variacion >= 0 ? 'trending-up' : 'trending-down'} size={14} color={e.variacion >= 0 ? colores.verdeOscuro : colores.rojo} />
              <Text style={[s.variacionTexto, { color: e.variacion >= 0 ? colores.verdeOscuro : colores.rojo }]}>
                {e.variacion >= 0 ? '+' : ''}
                {e.variacion}%
              </Text>
            </View>
          )}
        </View>
        <Texto v="peque" style={{ marginBottom: 10 }}>
          {e.variacion !== null ? `vs. ${periodo === 'semana' ? 'semana' : 'mes'} anterior (${e.puntosAnterior} pts)` : `Total histórico: ${progreso.puntosTotales} pts`}
        </Texto>
        <GraficaLineas datos={e.serie.map((x) => x.puntos)} etiquetas={etiquetas} ancho={anchoGrafica} />
      </Tarjeta>

      <View style={s.grid}>
        <Metrica icono="checkmark-done" valor={String(e.completadas)} etiqueta="Tareas completadas" />
        <Metrica icono="flame" valor={`${progreso.rachaActual}`} etiqueta="Días consecutivos" onPress={() => router.push('/racha')} />
        <Metrica icono="calendar" valor={`${e.diasCumplidos}`} etiqueta="Días con meta cumplida" />
        <Metrica icono="time" valor={e.minutos ? horas(e.minutos) : '—'} etiqueta="Tiempo dedicado" nota={e.minutos ? undefined : 'Agrega duración a tus tareas'} />
      </View>

      <Seccion titulo="Por categoría">
        <Tarjeta>
          {CATEGORIAS.map((c) => (
            <View key={c} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={categorias[c].icono as IconName} size={16} color={categorias[c].color} />
                  <Text style={s.catNombre}>{c}</Text>
                </View>
                <Text style={s.catValor}>{e.porCategoria[c]}</Text>
              </View>
              <BarraProgreso valor={e.porCategoria[c] / totalCat} color={categorias[c].color} fondo={categorias[c].fondo} alto={8} />
            </View>
          ))}
        </Tarjeta>
      </Seccion>
    </Pantalla>
  );
}

function Metrica({ icono, valor, etiqueta, nota, onPress }: { icono: IconName; valor: string; etiqueta: string; nota?: string; onPress?: () => void }) {
  return (
    <Tarjeta style={s.metrica} onPress={onPress}>
      <View style={s.metricaIcono}>
        <Ionicons name={icono} size={18} color={colores.verdeOscuro} />
      </View>
      <Text style={s.metricaValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={s.metricaEtiqueta}>{etiqueta}</Text>
      {nota && <Text style={[s.metricaEtiqueta, { fontSize: 10, marginTop: 2 }]}>{nota}</Text>}
    </Tarjeta>
  );
}

const s = StyleSheet.create({
  resumen: { backgroundColor: colores.verdeProfundo, borderRadius: radio.xl, padding: 18 },
  resumenEtiqueta: { fontFamily: fuentes.bold, fontSize: 11, letterSpacing: 1.2, color: colores.verde },
  resumenMensaje: { fontFamily: fuentes.bold, fontSize: 17, color: colores.blanco, marginTop: 6, lineHeight: 23 },
  resumenDato: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12 },
  resumenValor: { fontFamily: fuentes.extra, fontSize: 15, color: colores.amarillo },
  resumenSub: { fontFamily: fuentes.media, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  variacion: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  variacionTexto: { fontFamily: fuentes.bold, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  metrica: { width: '47.5%', flexGrow: 1, padding: 14 },
  metricaIcono: { width: 34, height: 34, borderRadius: 11, backgroundColor: colores.verdeSuave, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricaValor: { fontFamily: fuentes.extra, fontSize: 22, color: colores.texto },
  metricaEtiqueta: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  catNombre: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  catValor: { fontFamily: fuentes.bold, fontSize: 14, color: colores.texto },
});
