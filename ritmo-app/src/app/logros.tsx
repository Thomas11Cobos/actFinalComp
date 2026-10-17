// Pantalla 07 · Logros
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Medalla } from '@/components/graficos';
import { BarraProgreso, Chip, Encabezado, Pantalla, Vacio } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { NIVELES } from '@/lib/progreso';
import { colores, fuentes, radio, sombra } from '@/lib/tema';

export default function Logros() {
  const { logros, nivel, progreso } = useDatos();
  const [filtro, setFiltro] = useState<'todos' | 'progreso' | 'completados'>('todos');
  const lista = logros.filter((l) => (filtro === 'todos' ? true : filtro === 'completados' ? l.completado : !l.completado));
  const hechos = logros.filter((l) => l.completado).length;

  return (
    <Pantalla>
      <Encabezado titulo="Logros" />
      <View style={s.resumen}>
        <Text style={s.resumenValor}>
          {hechos}/{logros.length}
        </Text>
        <Text style={s.resumenTexto}>medallas desbloqueadas</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 12 }}>
          <BarraProgreso valor={hechos / logros.length} color={colores.amarillo} fondo="rgba(255,255,255,0.15)" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
        <Chip texto="Todos" activo={filtro === 'todos'} onPress={() => setFiltro('todos')} />
        <Chip texto="En progreso" activo={filtro === 'progreso'} onPress={() => setFiltro('progreso')} />
        <Chip texto="Completados" activo={filtro === 'completados'} onPress={() => setFiltro('completados')} />
      </View>

      {lista.length === 0 && <Vacio icono="ribbon-outline" titulo="Nada por aquí todavía" texto="Completa tareas y mantén tu racha para desbloquear medallas." />}
      {lista.map((l) => (
        <View key={l.id} style={[s.logro, l.completado && s.logroHecho]}>
          <Medalla icono={l.icono} activa={l.completado} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.nombre, !l.completado && { color: '#6B6B66' }]}>{l.nombre}</Text>
            <Text style={s.condicion}>{l.condicion}</Text>
            {l.completado ? (
              <Text style={s.hecho}>✓ Desbloqueado</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <View style={{ flex: 1 }}>
                  <BarraProgreso valor={l.actual / l.meta} alto={7} />
                </View>
                <Text style={s.avance}>
                  {l.actual}/{l.meta}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      <Text style={[s.nombre, { marginTop: 24, marginBottom: 12 }]}>Niveles</Text>
      {NIVELES.map((n) => {
        const actual = n.numero === nivel.nivel.numero;
        const alcanzado = progreso.puntosTotales >= n.min;
        return (
          <View key={n.numero} style={[s.nivel, actual && { borderColor: colores.amarillo, backgroundColor: colores.amarilloSuave }]}>
            <View style={[s.nivelNum, alcanzado && { backgroundColor: colores.amarillo }]}>
              <Text style={s.nivelNumTexto}>{n.numero}</Text>
            </View>
            <Text style={[s.nivelNombre, !alcanzado && { color: colores.gris }]}>{n.nombre}</Text>
            <Text style={s.condicion}>{n.max === null ? `${n.min.toLocaleString('es-CO')}+ pts` : `${n.min}–${n.max} pts`}</Text>
          </View>
        );
      })}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  resumen: { backgroundColor: colores.verdeProfundo, borderRadius: radio.xl, padding: 20, alignItems: 'center' },
  resumenValor: { fontFamily: fuentes.extra, fontSize: 40, color: colores.amarillo },
  resumenTexto: { fontFamily: fuentes.semi, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  logro: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.blanco, borderRadius: radio.l, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', ...sombra },
  logroHecho: { borderColor: '#F7DF9E' },
  nombre: { fontFamily: fuentes.bold, fontSize: 16, color: colores.texto },
  condicion: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  hecho: { fontFamily: fuentes.bold, fontSize: 12, color: '#B58612' },
  avance: { fontFamily: fuentes.bold, fontSize: 12, color: colores.gris },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.blanco, borderRadius: radio.m, padding: 12, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  nivelNum: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#EFEFEB', alignItems: 'center', justifyContent: 'center' },
  nivelNumTexto: { fontFamily: fuentes.extra, fontSize: 15, color: colores.verdeProfundo },
  nivelNombre: { flex: 1, fontFamily: fuentes.bold, fontSize: 15, color: colores.texto },
});
