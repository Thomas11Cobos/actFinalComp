// Autorregistro
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Logo } from '@/components/graficos';
import { avisar, Boton, Campo, Encabezado, Pantalla, Texto } from '@/components/ui';
import { registrarse } from '@/lib/api';
import { mensajeError } from '@/lib/supabase';
import { colores } from '@/lib/tema';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const validar = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Escribe un correo válido.';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres.';
    if (confirmacion !== password) e.confirmacion = 'Las contraseñas no coinciden.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const crear = async () => {
    if (!validar()) return;
    setError(null);
    setCargando(true);
    try {
      const { necesitaConfirmar } = await registrarse(nombre, email, password);
      if (necesitaConfirmar) {
        avisar('Revisa tu correo', 'Te enviamos un enlace para confirmar tu cuenta. Luego inicia sesión.');
        router.replace('/login');
      } else {
        router.replace('/');
      }
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <Encabezado titulo="" />
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Logo tam={68} />
          <Texto v="titulo" style={{ marginTop: 14 }}>
            Crea tu cuenta
          </Texto>
          <Texto v="peque" style={{ marginTop: 4 }}>
            Tu constancia también se mide.
          </Texto>
        </View>
        <Campo etiqueta="Nombre" icono="person-outline" placeholder="¿Cómo te llamas?" value={nombre} onChangeText={setNombre} error={errores.nombre} maxLength={60} />
        <Campo etiqueta="Correo" icono="mail-outline" placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} error={errores.email} />
        <Campo etiqueta="Contraseña" icono="lock-closed-outline" placeholder="Mínimo 6 caracteres" secureTextEntry value={password} onChangeText={setPassword} error={errores.password} />
        <Campo etiqueta="Confirmar contraseña" icono="lock-closed-outline" placeholder="Repite la contraseña" secureTextEntry value={confirmacion} onChangeText={setConfirmacion} error={errores.confirmacion} onSubmitEditing={crear} />
        {error && (
          <Texto v="peque" color={colores.rojo} style={{ marginBottom: 12 }}>
            {error}
          </Texto>
        )}
        <Boton titulo="Crear cuenta" onPress={crear} cargando={cargando} />
        <Boton titulo="Ya tengo una cuenta" tipo="texto" onPress={() => router.replace('/login')} style={{ marginTop: 8 }} />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
