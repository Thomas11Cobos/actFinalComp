// Módulo Usuarios (admin) · Consultar por id, actualizar y eliminar
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/graficos';
import { avisar, Boton, Campo, Cargando, Chip, confirmar, Encabezado, Etiqueta, FilaMenu, Interruptor, Pantalla, Tarjeta, Texto, Vacio } from '@/components/ui';
import { useSesion } from '@/context/Sesion';
import { adminActualizarUsuario, adminConsultarUsuario, adminEliminarUsuario, adminTareasDeUsuario } from '@/lib/api';
import { fechaCorta } from '@/lib/fechas';
import { nivelDe } from '@/lib/progreso';
import { mensajeError } from '@/lib/supabase';
import { colores, fuentes, radio } from '@/lib/tema';
import type { ResumenUsuario, Rol, Tarea } from '@/lib/tipos';

export default function DetalleUsuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfil } = useSesion();
  const [u, setU] = useState<ResumenUsuario | null | undefined>(undefined);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<Rol>('usuario');
  const [activo, setActivo] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const esYo = perfil?.id === id;

  const cargar = async () => {
    try {
      const r = await adminConsultarUsuario(id);
      setU(r);
      if (r) {
        setNombre(r.nombre);
        setEmail(r.email);
        setRol(r.rol);
        setActivo(r.activo);
        setTareas(await adminTareasDeUsuario(id));
      }
    } catch (e) {
      setError(mensajeError(e));
      setU(null);
    }
  };
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (u === undefined) return <Cargando />;
  if (!u)
    return (
      <Pantalla>
        <Encabezado titulo="Usuario" />
        <Vacio icono="person-remove-outline" titulo="Usuario no encontrado" texto={error ?? 'Puede que haya sido eliminado.'} />
      </Pantalla>
    );

  const guardar = async () => {
    if (!nombre.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Revisa el nombre y el correo.');
    if (password && password.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    setGuardando(true);
    setError(null);
    try {
      await adminActualizarUsuario({ id: u.id, nombre: nombre.trim(), email: email.trim(), rol, activo, password });
      setPassword('');
      setEditando(false);
      await cargar();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    const ok = await confirmar('¿Eliminar usuario?', `Se eliminará la cuenta de ${u.nombre} con todas sus tareas e historial. Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await adminEliminarUsuario(u.id);
      avisar('Usuario eliminado');
      router.back();
    } catch (e) {
      avisar('No se pudo eliminar', mensajeError(e));
    }
  };

  const nivel = nivelDe(Number(u.puntos));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <Encabezado titulo={editando ? 'Editar usuario' : 'Usuario'} />
        {!editando ? (
          <>
            <View style={{ alignItems: 'center' }}>
              <Avatar url={u.avatar_url} nombre={u.nombre} tam={88} />
              <Text style={s.nombre}>{u.nombre}</Text>
              <Text style={s.email}>{u.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                <Etiqueta texto={u.rol === 'admin' ? 'Administrador' : 'Usuario'} color={colores.verdeProfundo} fondo={u.rol === 'admin' ? colores.amarillo : colores.verdeSuave} />
                <Etiqueta texto={u.activo ? 'Activo' : 'Desactivado'} color={u.activo ? colores.verdeOscuro : colores.rojo} fondo={u.activo ? colores.verdeSuave : colores.rojoSuave} />
              </View>
            </View>

            <View style={s.kpis}>
              <Kpi valor={String(u.puntos)} etiqueta="Puntos" />
              <Kpi valor={`Nv. ${nivel.nivel.numero}`} etiqueta={nivel.nivel.nombre} />
              <Kpi valor={String(u.cumplimientos)} etiqueta="Cumplimientos" />
            </View>

            <Tarjeta style={{ marginTop: 14 }}>
              <Texto v="etiqueta">Información</Texto>
              <Linea k="ID" v={u.id} />
              <Linea k="Registrado" v={fechaCorta(u.creado_en.slice(0, 10))} />
              <Linea k="Última actividad" v={u.ultima_actividad ? fechaCorta(u.ultima_actividad) : 'Sin actividad'} />
            </Tarjeta>

            <Tarjeta style={{ marginTop: 14 }}>
              <Texto v="etiqueta" style={{ marginBottom: 6 }}>
                Tareas ({tareas.length})
              </Texto>
              {tareas.length === 0 ? (
                <Texto v="peque">Este usuario aún no tiene tareas.</Texto>
              ) : (
                tareas.map((t) => (
                  <View key={t.id} style={s.tarea}>
                    <Text style={s.tareaNombre} numberOfLines={1}>
                      {t.nombre}
                    </Text>
                    <Text style={s.tareaMeta}>
                      {t.categoria} · +{t.puntos}
                    </Text>
                  </View>
                ))
              )}
            </Tarjeta>

            <Boton titulo="Editar usuario" icono="create-outline" tipo="secundario" onPress={() => setEditando(true)} style={{ marginTop: 20 }} />
            {!esYo && <Boton titulo="Eliminar usuario" icono="trash-outline" tipo="peligro" onPress={eliminar} style={{ marginTop: 10 }} />}
          </>
        ) : (
          <>
            <Campo etiqueta="Nombre" icono="person-outline" value={nombre} onChangeText={setNombre} maxLength={60} />
            <Campo etiqueta="Correo" icono="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Campo etiqueta="Nueva contraseña (opcional)" icono="key-outline" placeholder="Déjalo vacío para no cambiarla" autoCapitalize="none" value={password} onChangeText={setPassword} />
            <Texto v="etiqueta" style={{ marginBottom: 8 }}>
              Rol
            </Texto>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Chip texto="Usuario" activo={rol === 'usuario'} onPress={() => !esYo && setRol('usuario')} />
              <Chip texto="Administrador" activo={rol === 'admin'} onPress={() => setRol('admin')} />
            </View>
            <Tarjeta style={{ paddingVertical: 6 }}>
              <FilaMenu icono="power-outline" texto="Cuenta activa" derecha={<Interruptor valor={activo} onCambio={setActivo} deshabilitado={esYo} />} />
            </Tarjeta>
            {esYo && (
              <Texto v="peque" style={{ marginTop: 8 }}>
                No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.
              </Texto>
            )}
            {error && (
              <Texto v="peque" color={colores.rojo} style={{ marginTop: 12 }}>
                {error}
              </Texto>
            )}
            <Boton titulo="Guardar cambios" icono="checkmark-circle" onPress={guardar} cargando={guardando} style={{ marginTop: 22 }} />
            <Boton
              titulo="Cancelar"
              tipo="texto"
              onPress={() => {
                setEditando(false);
                setError(null);
                setNombre(u.nombre);
                setEmail(u.email);
                setRol(u.rol);
                setActivo(u.activo);
              }}
            />
          </>
        )}
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

function Kpi({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <View style={s.kpi}>
      <Text style={s.kpiValor} numberOfLines={1}>
        {valor}
      </Text>
      <Text style={s.kpiEtiqueta} numberOfLines={1}>
        {etiqueta}
      </Text>
    </View>
  );
}

function Linea({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }}>
      <Text style={s.tareaMeta}>{k}</Text>
      <Text style={[s.tareaNombre, { fontSize: 13, flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>
        {v}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  nombre: { fontFamily: fuentes.extra, fontSize: 22, color: colores.texto, marginTop: 12 },
  email: { fontFamily: fuentes.media, fontSize: 13, color: colores.gris },
  kpis: { flexDirection: 'row', gap: 10, marginTop: 20 },
  kpi: { flex: 1, backgroundColor: colores.blanco, borderRadius: radio.m, padding: 12, alignItems: 'center' },
  kpiValor: { fontFamily: fuentes.extra, fontSize: 18, color: colores.verdeOscuro },
  kpiEtiqueta: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris },
  tarea: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0EC', gap: 10 },
  tareaNombre: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto, flex: 1 },
  tareaMeta: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
});
