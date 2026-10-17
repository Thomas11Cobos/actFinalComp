// Pantalla 09 · Recordatorios (funcionalidad móvil: notificaciones locales)
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { avisar, Boton, Encabezado, FilaMenu, Interruptor, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { horaCorta } from '@/lib/fechas';
import { enviarPrueba, guardarPrefs, leerPrefs, notificacionesDisponibles, PREFS_INICIALES, reprogramar, type PrefsRecordatorios } from '@/lib/notificaciones';
import { colores, fuentes, radio } from '@/lib/tema';

export default function Recordatorios() {
  const { tareas } = useDatos();
  const [p, setP] = useState<PrefsRecordatorios>(PREFS_INICIALES);
  const [programadas, setProgramadas] = useState<number | null>(null);

  useEffect(() => {
    leerPrefs().then(setP);
  }, []);

  const cambiar = async (cambios: Partial<PrefsRecordatorios>) => {
    const n = { ...p, ...cambios };
    setP(n);
    await guardarPrefs(n);
    setProgramadas(await reprogramar(tareas, n));
  };

  const conHora = tareas.filter((t) => t.hora_recordatorio);

  return (
    <Pantalla>
      <Encabezado titulo="Recordatorios" />
      {!notificacionesDisponibles && (
        <View style={s.aviso}>
          <Ionicons name="phone-portrait-outline" size={18} color="#9A6F07" />
          <Text style={s.avisoTexto}>Las notificaciones funcionan en el teléfono. En la versión web solo se guardan las preferencias.</Text>
        </View>
      )}

      <Tarjeta style={{ paddingVertical: 6 }}>
        <FilaMenu icono="notifications-outline" texto="Activar notificaciones" derecha={<Interruptor valor={p.activas} onCambio={(v) => cambiar({ activas: v })} />} />
      </Tarjeta>

      <View style={{ opacity: p.activas ? 1 : 0.45 }} pointerEvents={p.activas ? 'auto' : 'none'}>
        <Texto v="etiqueta" style={s.etiqueta}>
          Tipos de aviso
        </Texto>
        <Tarjeta style={{ paddingVertical: 6 }}>
          <FilaMenu icono="alarm-outline" texto="Recordatorio de tareas" derecha={<Interruptor valor={p.tareas} onCambio={(v) => cambiar({ tareas: v })} />} />
          <FilaMenu icono="sunny-outline" texto="Resumen diario" derecha={<Interruptor valor={p.resumen} onCambio={(v) => cambiar({ resumen: v })} />} />
          {p.resumen && <SelectorHora hora={p.resumenHora} onCambio={(h) => cambiar({ resumenHora: h })} />}
          <FilaMenu icono="flame-outline" texto="Recordatorio de racha" derecha={<Interruptor valor={p.racha} onCambio={(v) => cambiar({ racha: v })} />} />
          {p.racha && <SelectorHora hora={p.rachaHora} onCambio={(h) => cambiar({ rachaHora: h })} />}
        </Tarjeta>

        <Texto v="etiqueta" style={s.etiqueta}>
          Tareas con recordatorio ({conHora.length})
        </Texto>
        <Tarjeta>
          {conHora.length === 0 ? (
            <Texto v="peque">Ninguna tarea tiene hora. Edita una tarea y activa “Recordatorio”.</Texto>
          ) : (
            conHora.map((t) => (
              <Pressable key={t.id} onPress={() => router.push(`/tarea/${t.id}`)} style={s.tarea}>
                <Text style={s.tareaNombre} numberOfLines={1}>
                  {t.nombre}
                </Text>
                <Text style={s.tareaHora}>{horaCorta(t.hora_recordatorio)}</Text>
              </Pressable>
            ))
          )}
        </Tarjeta>

        {programadas !== null && notificacionesDisponibles && (
          <Texto v="peque" style={{ marginTop: 12, textAlign: 'center' }}>
            {programadas} notificaciones programadas en este teléfono
          </Texto>
        )}
        {notificacionesDisponibles && (
          <Boton
            titulo="Enviar notificación de prueba"
            icono="paper-plane-outline"
            tipo="secundario"
            style={{ marginTop: 18 }}
            onPress={async () => {
              const ok = await enviarPrueba();
              avisar(ok ? 'Llegará en 3 segundos' : 'Permiso denegado', ok ? 'Puedes minimizar la app para verla.' : 'Activa las notificaciones de RITMO en los ajustes del teléfono.');
            }}
          />
        )}
      </View>
    </Pantalla>
  );
}

function SelectorHora({ hora, onCambio }: { hora: number; onCambio: (h: number) => void }) {
  return (
    <View style={s.selector}>
      <Text style={s.selectorTexto}>Hora</Text>
      <Pressable accessibilityLabel="Hora anterior" hitSlop={8} onPress={() => onCambio((hora + 23) % 24)}>
        <Ionicons name="remove-circle-outline" size={24} color={colores.verdeOscuro} />
      </Pressable>
      <Text style={s.selectorHora}>{horaCorta(`${hora}:00`)}</Text>
      <Pressable accessibilityLabel="Hora siguiente" hitSlop={8} onPress={() => onCambio((hora + 1) % 24)}>
        <Ionicons name="add-circle-outline" size={24} color={colores.verdeOscuro} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  aviso: { flexDirection: 'row', gap: 10, backgroundColor: colores.amarilloSuave, padding: 12, borderRadius: radio.m, marginBottom: 14, alignItems: 'center' },
  avisoTexto: { flex: 1, fontFamily: fuentes.media, fontSize: 12, color: '#7A5A0A' },
  etiqueta: { marginTop: 20, marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 56, paddingBottom: 10 },
  selectorTexto: { fontFamily: fuentes.media, fontSize: 13, color: colores.gris, flex: 1 },
  selectorHora: { fontFamily: fuentes.extra, fontSize: 15, color: colores.texto, minWidth: 84, textAlign: 'center' },
  tarea: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0EC', gap: 12 },
  tareaNombre: { flex: 1, fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  tareaHora: { fontFamily: fuentes.bold, fontSize: 13, color: colores.verdeOscuro },
});
