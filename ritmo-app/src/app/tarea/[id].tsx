// Módulo Tareas · Consultar por id, actualizar y eliminar
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { FormTarea } from '@/components/FormTarea';
import { avisar, Boton, Cargando, confirmar, Encabezado, Etiqueta, Pantalla, Tarjeta, Texto, Vacio, type IconName } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { consultarTarea } from '@/lib/api';
import { DIAS_NOMBRE, fechaCorta, fechaLarga, horaCorta } from '@/lib/fechas';
import { mensajeError } from '@/lib/supabase';
import { categorias, colores, fuentes } from '@/lib/tema';
import { NOMBRE_DIFICULTAD, NOMBRE_FRECUENCIA, type Tarea } from '@/lib/tipos';

export default function DetalleTarea() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actualizar, eliminar, cumplimientos, completadaHoy, tareasHoy, alternar } = useDatos();
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    // Consulta por id directamente a la API
    consultarTarea(Number(id))
      .then(setTarea)
      .catch((e) => setError(mensajeError(e)));
  }, [id]);

  if (error) {
    return (
      <Pantalla>
        <Encabezado titulo="Tarea" />
        <Vacio icono="alert-circle-outline" titulo="No encontramos esta tarea" texto={error} />
      </Pantalla>
    );
  }
  if (!tarea) return <Cargando />;

  const historial = cumplimientos.filter((c) => c.tarea_id === tarea.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const puntos = historial.reduce((s, c) => s + c.puntos, 0);
  const cat = categorias[tarea.categoria];
  const esHoy = tareasHoy.some((t) => t.id === tarea.id);
  const hecha = completadaHoy(tarea.id);

  const borrar = async () => {
    const ok = await confirmar('¿Eliminar tarea?', `"${tarea.nombre}" se eliminará. Tus puntos e historial se conservan.`);
    if (!ok) return;
    setBorrando(true);
    try {
      await eliminar(tarea.id);
      router.back();
    } catch (e) {
      avisar('No se pudo eliminar', mensajeError(e));
      setBorrando(false);
    }
  };

  if (editando) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pantalla>
          <Encabezado titulo="Editar tarea" />
          <FormTarea
            inicial={tarea}
            textoBoton="Guardar cambios"
            onCancelar={() => setEditando(false)}
            onGuardar={async (t) => {
              try {
                setTarea(await actualizar(tarea.id, t));
                setEditando(false);
              } catch (e) {
                throw new Error(mensajeError(e));
              }
            }}
          />
        </Pantalla>
      </KeyboardAvoidingView>
    );
  }

  const cuando =
    tarea.frecuencia === 'diaria'
      ? 'Todos los días'
      : tarea.frecuencia === 'semanal'
        ? tarea.dias.map((d) => DIAS_NOMBRE[d]).join(', ')
        : tarea.fecha
          ? fechaLarga(tarea.fecha)
          : '';

  return (
    <Pantalla>
      <Encabezado titulo="Detalle" />
      <Tarjeta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Etiqueta texto={tarea.categoria} color={cat.color} fondo={cat.fondo} icono={cat.icono as IconName} />
          <Etiqueta texto={`${NOMBRE_DIFICULTAD[tarea.dificultad]} · +${tarea.puntos}`} color="#9A6F07" fondo={colores.amarilloSuave} />
        </View>
        <Texto v="titulo">{tarea.nombre}</Texto>
        {tarea.descripcion ? (
          <Texto v="cuerpo" color={colores.gris} style={{ marginTop: 6 }}>
            {tarea.descripcion}
          </Texto>
        ) : null}
        <View style={{ marginTop: 16, gap: 10 }}>
          <Dato icono="repeat" titulo={NOMBRE_FRECUENCIA[tarea.frecuencia]} texto={cuando} />
          {tarea.duracion_min ? <Dato icono="hourglass-outline" titulo="Duración" texto={`${tarea.duracion_min} minutos`} /> : null}
          <Dato icono="alarm-outline" titulo="Recordatorio" texto={tarea.hora_recordatorio ? horaCorta(tarea.hora_recordatorio) : 'Sin recordatorio'} />
        </View>
        {esHoy && (
          <Boton
            titulo={hecha ? 'Completada hoy · desmarcar' : 'Marcar como completada'}
            icono={hecha ? 'refresh' : 'checkmark-circle'}
            tipo={hecha ? 'secundario' : 'primario'}
            onPress={() => alternar(tarea).catch((e) => avisar('No se pudo guardar', mensajeError(e)))}
            style={{ marginTop: 18 }}
          />
        )}
      </Tarjeta>

      <View style={s.resumen}>
        <View style={s.resumenItem}>
          <Text style={s.resumenValor}>{historial.length}</Text>
          <Text style={s.resumenEtiqueta}>veces cumplida</Text>
        </View>
        <View style={s.resumenItem}>
          <Text style={s.resumenValor}>{puntos}</Text>
          <Text style={s.resumenEtiqueta}>puntos ganados</Text>
        </View>
      </View>

      {historial.length > 0 && (
        <Tarjeta style={{ marginTop: 14 }}>
          <Texto v="subtitulo" style={{ marginBottom: 10 }}>
            Historial reciente
          </Texto>
          {historial.slice(0, 7).map((c) => (
            <View key={c.id} style={s.historial}>
              <Ionicons name="checkmark-circle" size={18} color={colores.verde} />
              <Text style={s.historialFecha}>{fechaCorta(c.fecha)}</Text>
              <Text style={s.historialPuntos}>+{c.puntos}</Text>
            </View>
          ))}
        </Tarjeta>
      )}

      <Boton titulo="Editar tarea" icono="create-outline" tipo="secundario" onPress={() => setEditando(true)} style={{ marginTop: 20 }} />
      <Boton titulo="Eliminar tarea" icono="trash-outline" tipo="peligro" onPress={borrar} cargando={borrando} style={{ marginTop: 10 }} />
    </Pantalla>
  );
}

function Dato({ icono, titulo, texto }: { icono: IconName; titulo: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={s.datoIcono}>
        <Ionicons name={icono} size={18} color={colores.verdeOscuro} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.datoTitulo}>{titulo}</Text>
        <Text style={s.datoTexto}>{texto}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  datoIcono: { width: 36, height: 36, borderRadius: 12, backgroundColor: colores.verdeSuave, alignItems: 'center', justifyContent: 'center' },
  datoTitulo: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  datoTexto: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  resumen: { flexDirection: 'row', gap: 12, marginTop: 14 },
  resumenItem: { flex: 1, backgroundColor: colores.verdeProfundo, borderRadius: 18, padding: 16 },
  resumenValor: { fontFamily: fuentes.extra, fontSize: 26, color: colores.blanco },
  resumenEtiqueta: { fontFamily: fuentes.media, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  historial: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  historialFecha: { flex: 1, fontFamily: fuentes.media, fontSize: 14, color: colores.texto },
  historialPuntos: { fontFamily: fuentes.extra, fontSize: 14, color: colores.verdeOscuro },
});
