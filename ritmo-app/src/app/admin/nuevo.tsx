// Módulo Usuarios (admin) · Registrar usuario
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { avisar, Boton, Campo, Chip, Encabezado, Pantalla, Texto } from '@/components/ui';
import { adminRegistrarUsuario } from '@/lib/api';
import { mensajeError } from '@/lib/supabase';
import { colores } from '@/lib/tema';
import type { Rol } from '@/lib/tipos';

export default function NuevoUsuario() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('usuario');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Escribe un correo válido.';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres.';
    setErrores(e);
    if (Object.keys(e).length) return;
    setGuardando(true);
    setError(null);
    try {
      await adminRegistrarUsuario({ nombre: nombre.trim(), email: email.trim(), password, rol });
      avisar('Usuario registrado', `${nombre.trim()} ya puede iniciar sesión con su correo y contraseña.`);
      router.back();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <Encabezado titulo="Registrar usuario" />
        <Campo etiqueta="Nombre" icono="person-outline" placeholder="Nombre completo" value={nombre} onChangeText={setNombre} error={errores.nombre} maxLength={60} />
        <Campo etiqueta="Correo" icono="mail-outline" placeholder="correo@ejemplo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} error={errores.email} />
        <Campo etiqueta="Contraseña temporal" icono="key-outline" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} error={errores.password} autoCapitalize="none" />
        <Texto v="etiqueta" style={{ marginBottom: 8 }}>
          Rol
        </Texto>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip texto="Usuario" icono="person-outline" activo={rol === 'usuario'} onPress={() => setRol('usuario')} />
          <Chip texto="Administrador" icono="shield-checkmark-outline" activo={rol === 'admin'} onPress={() => setRol('admin')} />
        </View>
        {error && (
          <Texto v="peque" color={colores.rojo} style={{ marginTop: 16 }}>
            {error}
          </Texto>
        )}
        <Boton titulo="Registrar usuario" icono="person-add" onPress={guardar} cargando={guardando} style={{ marginTop: 26 }} />
        <Boton titulo="Cancelar" tipo="texto" onPress={() => router.back()} style={{ marginTop: 6 }} />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
