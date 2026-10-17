// Módulo Usuarios · Actualizar mi cuenta (nombre, meta diaria, contraseña)
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { avisar, Boton, Campo, Chip, Encabezado, Pantalla, Texto } from '@/components/ui';
import { useSesion } from '@/context/Sesion';
import { actualizarMiPerfil, cambiarMiContrasena } from '@/lib/api';
import { mensajeError } from '@/lib/supabase';
import { colores } from '@/lib/tema';

export default function EditarPerfil() {
  const { perfil, setPerfil } = useSesion();
  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [meta, setMeta] = useState(perfil?.meta_diaria ?? 50);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  if (!perfil) return null;

  const guardar = async () => {
    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (password && password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setGuardando(true);
    setError(null);
    try {
      setPerfil(await actualizarMiPerfil(perfil.id, { nombre: nombre.trim(), meta_diaria: meta }));
      if (password) await cambiarMiContrasena(password);
      avisar('Cambios guardados');
      router.back();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <Encabezado titulo="Mi cuenta" />
        <Campo etiqueta="Nombre" icono="person-outline" value={nombre} onChangeText={setNombre} maxLength={60} />
        <Campo etiqueta="Correo" icono="mail-outline" value={perfil.email} editable={false} />
        <Campo etiqueta="Nueva contraseña (opcional)" icono="lock-closed-outline" placeholder="Déjalo vacío para no cambiarla" secureTextEntry value={password} onChangeText={setPassword} />
        <Texto v="etiqueta" style={{ marginBottom: 8 }}>
          Meta diaria para la racha
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[30, 50, 70, 80, 100].map((m) => (
            <Chip key={m} texto={`${m}%`} activo={meta === m} onPress={() => setMeta(m)} />
          ))}
        </View>
        <Texto v="peque" style={{ marginTop: 8 }}>
          Un día cuenta para tu racha cuando completas al menos este porcentaje de tus tareas programadas.
        </Texto>
        {error && (
          <Texto v="peque" color={colores.rojo} style={{ marginTop: 14 }}>
            {error}
          </Texto>
        )}
        <Boton titulo="Guardar cambios" icono="checkmark-circle" onPress={guardar} cargando={guardando} style={{ marginTop: 24 }} />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
