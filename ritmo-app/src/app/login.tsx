// Iniciar sesión
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Logo } from '@/components/graficos';
import { Boton, Campo, Encabezado, Pantalla, Texto } from '@/components/ui';
import { iniciarSesion } from '@/lib/api';
import { mensajeError } from '@/lib/supabase';
import { colores } from '@/lib/tema';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !password) return setError('Escribe tu correo y tu contraseña.');
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, password);
      router.replace('/');
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
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Logo tam={76} />
          <Texto v="titulo" style={{ marginTop: 16 }}>
            Hola de nuevo
          </Texto>
          <Texto v="peque" style={{ marginTop: 4 }}>
            ¿Listo para mantener tu ritmo?
          </Texto>
        </View>
        <Campo etiqueta="Correo" icono="mail-outline" placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
        <Campo etiqueta="Contraseña" icono="lock-closed-outline" placeholder="••••••" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={entrar} />
        {error && (
          <Texto v="peque" color={colores.rojo} style={{ marginBottom: 12 }}>
            {error}
          </Texto>
        )}
        <Boton titulo="Iniciar sesión" onPress={entrar} cargando={cargando} />
        <Boton titulo="¿No tienes cuenta? Regístrate" tipo="texto" onPress={() => router.replace('/registro')} style={{ marginTop: 8 }} />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
