// Módulo Usuarios (perfil admin) · Consultar todos los usuarios
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/graficos';
import { Chip, Pantalla, Texto, Vacio } from '@/components/ui';
import { useSesion } from '@/context/Sesion';
import { adminListarUsuarios } from '@/lib/api';
import { fechaCorta } from '@/lib/fechas';
import { mensajeError } from '@/lib/supabase';
import { colores, fuentes, radio, sombra } from '@/lib/tema';
import type { ResumenUsuario } from '@/lib/tipos';

export default function Usuarios() {
  const { esAdmin } = useSesion();
  const [usuarios, setUsuarios] = useState<ResumenUsuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'admin' | 'usuario' | 'inactivos'>('todos');

  useFocusEffect(
    useCallback(() => {
      if (!esAdmin) return;
      adminListarUsuarios()
        .then((u) => {
          setUsuarios(u);
          setError(null);
        })
        .catch((e) => setError(mensajeError(e)));
    }, [esAdmin]),
  );

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (usuarios ?? [])
      .filter((u) => (filtro === 'todos' ? true : filtro === 'inactivos' ? !u.activo : u.rol === filtro))
      .filter((u) => !q || u.nombre.toLowerCase().includes(q) || u.email.includes(q));
  }, [usuarios, busqueda, filtro]);

  if (!esAdmin) return <Redirect href="/(tabs)" />;

  const total = usuarios?.length ?? 0;
  const activos = usuarios?.filter((u) => u.activo).length ?? 0;
  const puntos = usuarios?.reduce((s, u) => s + Number(u.puntos), 0) ?? 0;

  return (
    <Pantalla>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Texto v="titulo">Usuarios</Texto>
          <Texto v="peque">Panel de administración</Texto>
        </View>
        <Pressable accessibilityLabel="Registrar usuario" onPress={() => router.push('/admin/nuevo')} style={s.mas}>
          <Ionicons name="person-add" size={22} color={colores.verdeProfundo} />
        </Pressable>
      </View>

      <View style={s.kpis}>
        <Kpi valor={total} etiqueta="Usuarios" />
        <Kpi valor={activos} etiqueta="Activos" />
        <Kpi valor={puntos} etiqueta="Puntos totales" />
      </View>

      <View style={s.buscar}>
        <Ionicons name="search" size={18} color={colores.gris} />
        <TextInput placeholder="Buscar por nombre o correo" placeholderTextColor="#B0B0AA" autoCapitalize="none" value={busqueda} onChangeText={setBusqueda} style={s.buscarInput} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 }}>
        <Chip texto="Todos" activo={filtro === 'todos'} onPress={() => setFiltro('todos')} />
        <Chip texto="Admins" activo={filtro === 'admin'} onPress={() => setFiltro('admin')} />
        <Chip texto="Usuarios" activo={filtro === 'usuario'} onPress={() => setFiltro('usuario')} />
        <Chip texto="Inactivos" activo={filtro === 'inactivos'} onPress={() => setFiltro('inactivos')} />
      </View>

      {error ? (
        <Vacio icono="alert-circle-outline" titulo="No se pudieron cargar los usuarios" texto={error} />
      ) : !usuarios ? (
        <ActivityIndicator color={colores.verde} style={{ marginTop: 30 }} />
      ) : lista.length === 0 ? (
        <Vacio icono="people-outline" titulo="Sin resultados" texto="No hay usuarios con ese filtro." />
      ) : (
        lista.map((u) => (
          <Pressable key={u.id} onPress={() => router.push(`/admin/${u.id}`)} style={({ pressed }) => [s.fila, pressed && { opacity: 0.85 }, !u.activo && { opacity: 0.55 }]}>
            <Avatar url={u.avatar_url} nombre={u.nombre} tam={44} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.nombre} numberOfLines={1}>
                  {u.nombre}
                </Text>
                {u.rol === 'admin' && <Ionicons name="shield-checkmark" size={14} color="#B58612" />}
              </View>
              <Text style={s.email} numberOfLines={1}>
                {u.email}
              </Text>
              <Text style={s.meta}>
                {u.tareas} tareas · {u.ultima_actividad ? `activo ${fechaCorta(u.ultima_actividad)}` : 'sin actividad'}
                {!u.activo ? ' · desactivado' : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.puntos}>{u.puntos}</Text>
              <Text style={s.meta}>pts</Text>
            </View>
          </Pressable>
        ))
      )}
    </Pantalla>
  );
}

function Kpi({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiValor}>{valor.toLocaleString('es-CO')}</Text>
      <Text style={s.kpiEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  mas: { width: 48, height: 48, borderRadius: 16, backgroundColor: colores.verde, alignItems: 'center', justifyContent: 'center', ...sombra },
  kpis: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpi: { flex: 1, backgroundColor: colores.verdeProfundo, borderRadius: radio.m, padding: 12 },
  kpiValor: { fontFamily: fuentes.extra, fontSize: 20, color: colores.blanco },
  kpiEtiqueta: { fontFamily: fuentes.media, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  buscar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colores.blanco, borderRadius: radio.m, paddingHorizontal: 14 },
  buscarInput: { flex: 1, minHeight: 48, fontFamily: fuentes.media, fontSize: 15, color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.blanco, borderRadius: radio.m, padding: 12, marginBottom: 10, ...sombra },
  nombre: { fontFamily: fuentes.bold, fontSize: 15, color: colores.texto, flexShrink: 1 },
  email: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  meta: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris, marginTop: 2 },
  puntos: { fontFamily: fuentes.extra, fontSize: 17, color: colores.verdeOscuro },
});
