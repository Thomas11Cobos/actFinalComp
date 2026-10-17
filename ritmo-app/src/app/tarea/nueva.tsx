// Módulo Tareas · Registrar
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { FormTarea } from '@/components/FormTarea';
import { Encabezado, Pantalla } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { mensajeError } from '@/lib/supabase';

export default function NuevaTarea() {
  const { crear } = useDatos();
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <Encabezado titulo="Nueva tarea" />
        <FormTarea
          textoBoton="Crear tarea"
          onCancelar={volver}
          onGuardar={async (t) => {
            try {
              await crear(t);
              volver();
            } catch (e) {
              throw new Error(mensajeError(e));
            }
          }}
        />
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
