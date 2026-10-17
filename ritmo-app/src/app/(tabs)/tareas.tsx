// Módulo Tareas · Consultar todas (con búsqueda y filtros)
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TareaFila } from '@/components/TareaFila';
import { Boton, Chip, Pantalla, Texto, Vacio } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { DIAS_ABREV } from '@/lib/fechas';
import { categorias, colores, fuentes, radio, sombra } from '@/lib/tema';
import { CATEGORIAS, type Categoria, type Tarea } from '@/lib/tipos';

function describir(t: Tarea) {
  if (t.frecuencia === 'diaria') return 'Todos los días';
  if (t.frecuencia === 'semanal') return t.dias.map((d) => DIAS_ABREV[d]).join(', ');
  return 'Una vez';
}

export default function Tareas() {
  const { tareas, completadaHoy, tareasHoy } = useDatos();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Categoria | 'Todas'>('Todas');

  const lista = useMemo(
    () =>
      tareas
        .filter((t) => filtro === 'Todas' || t.categoria === filtro)
        .filter((t) => t.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [tareas, filtro, busqueda],
  );
  const idsHoy = new Set(tareasHoy.map((t) => t.id));

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Texto v="titulo">Mis tareas</Texto>
          <Texto v="peque">
            {tareas.length} {tareas.length === 1 ? 'tarea' : 'tareas'} en total
          </Texto>
        </View>
        <Pressable accessibilityLabel="Nueva tarea" onPress={() => router.push('/tarea/nueva')} style={s.mas}>
          <Ionicons name="add" size={26} color={colores.verdeProfundo} />
        </Pressable>
      </View>

      <View style={s.buscar}>
        <Ionicons name="search" size={18} color={colores.gris} />
        <TextInput placeholder="Buscar tarea" placeholderTextColor="#B0B0AA" value={busqueda} onChangeText={setBusqueda} style={s.buscarInput} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
        <Chip texto="Todas" activo={filtro === 'Todas'} onPress={() => setFiltro('Todas')} />
        {CATEGORIAS.map((c) => (
          <Chip key={c} texto={c} activo={filtro === c} color={categorias[c].color} fondo={categorias[c].fondo} onPress={() => setFiltro(c)} />
        ))}
      </ScrollView>

      {lista.length === 0 ? (
        <Vacio
          icono="list-outline"
          titulo={tareas.length ? 'Sin resultados' : 'Aún no tienes tareas'}
          texto={tareas.length ? 'Prueba con otra búsqueda o categoría.' : 'Crea tu primera tarea para empezar.'}
          accion={!tareas.length ? <Boton titulo="Nueva tarea" icono="add" onPress={() => router.push('/tarea/nueva')} /> : undefined}
        />
      ) : (
        lista.map((t) => (
          <View key={t.id}>
            <TareaFila tarea={t} hecha={idsHoy.has(t.id) && completadaHoy(t.id)} onAbrir={() => router.push(`/tarea/${t.id}`)} />
            <Text style={s.frecuencia}>
              {describir(t)}
              {idsHoy.has(t.id) ? ' · programada hoy' : ''}
            </Text>
          </View>
        ))
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  mas: { width: 48, height: 48, borderRadius: 16, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center', ...sombra },
  buscar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colores.blanco, borderRadius: radio.m, paddingHorizontal: 14 },
  buscarInput: { flex: 1, minHeight: 48, fontFamily: fuentes.media, fontSize: 15, color: colores.texto },
  frecuencia: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris, marginTop: -6, marginBottom: 12, marginLeft: 14 },
});
