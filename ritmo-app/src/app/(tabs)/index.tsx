// Pantalla 02 · Inicio / Tareas del día
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Anillo, Avatar } from '@/components/graficos';
import { TareaFila } from '@/components/TareaFila';
import { avisar, BarraProgreso, Boton, Seccion, Texto, Vacio } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { useSesion } from '@/context/Sesion';
import { fechaLarga, saludo, sumarDias } from '@/lib/fechas';
import { mensajeError } from '@/lib/supabase';
import { colores, fuentes, radio, sombra } from '@/lib/tema';

export default function Inicio() {
  const { perfil } = useSesion();
  const { hoy, tareasHoy, completadaHoy, alternar, progreso, nivel, cargando, recargar, error } = useDatos();

  const hechas = tareasHoy.filter((t) => completadaHoy(t.id)).length;
  const pct = tareasHoy.length ? hechas / tareasHoy.length : 0;
  const puntosSemana = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, -i)).reduce((s, f) => s + (progreso.porFecha[f]?.puntos ?? 0), 0);
  const pendientes = tareasHoy.filter((t) => !completadaHoy(t.id));
  const completadas = tareasHoy.filter((t) => completadaHoy(t.id));
  const meta = perfil?.meta_diaria ?? 50;

  const onAlternar = async (id: number) => {
    const t = tareasHoy.find((x) => x.id === id);
    if (!t) return;
    try {
      await alternar(t);
    } catch (e) {
      avisar('No se pudo guardar', mensajeError(e));
    }
  };

  let mensaje = 'Hola, ¿listo para mantener tu ritmo?';
  if (tareasHoy.length && hechas === tareasHoy.length) mensaje = '¡Día completo! Eres imparable 🎉';
  else if (pct * 100 >= meta) mensaje = '¡Meta diaria cumplida! Tu racha está a salvo 🔥';
  else if (hechas > 0) mensaje = 'Vas muy bien, sigue así.';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colores.crema }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colores.verde} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={s.encabezado}>
          <Pressable onPress={() => router.push('/(tabs)/perfil')}>
            <Avatar url={perfil?.avatar_url} nombre={perfil?.nombre ?? ''} tam={46} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.saludo}>
              {saludo()}, {perfil?.nombre.split(' ')[0]}
            </Text>
            <Text style={s.fecha}>{fechaLarga(hoy)}</Text>
          </View>
          <Pressable accessibilityLabel="Recordatorios" onPress={() => router.push('/recordatorios')} style={s.campana}>
            <Ionicons name="notifications-outline" size={22} color={colores.texto} />
          </Pressable>
        </View>

        {error && (
          <Pressable onPress={recargar} style={s.error}>
            <Ionicons name="cloud-offline-outline" size={18} color={colores.rojo} />
            <Text style={{ flex: 1, color: colores.rojo, fontFamily: fuentes.semi, fontSize: 13 }}>No pudimos cargar tus datos. Toca para reintentar.</Text>
          </Pressable>
        )}

        {/* Tarjeta "Tu ritmo" */}
        <Pressable onPress={() => router.push('/racha')} style={s.ritmo}>
          <Anillo valor={pct} tam={118} grosor={13}>
            <Text style={s.pct}>{Math.round(pct * 100)}%</Text>
            <Text style={s.pctEtiqueta}>de hoy</Text>
          </Anillo>
          <View style={{ flex: 1, gap: 10 }}>
            <Text style={s.ritmoTitulo}>Tu ritmo</Text>
            <Text style={s.ritmoMensaje}>{mensaje}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={s.mini}>
                <Text style={s.miniValor}>🔥 {progreso.rachaActual}</Text>
                <Text style={s.miniEtiqueta}>días</Text>
              </View>
              <View style={s.mini}>
                <Text style={s.miniValor}>⭐ {puntosSemana}</Text>
                <Text style={s.miniEtiqueta}>pts semana</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Nivel */}
        <Pressable onPress={() => router.push('/logros')} style={s.nivel}>
          <View style={s.nivelIcono}>
            <Text style={s.nivelNumero}>{nivel.nivel.numero}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.nivelNombre}>
                Nivel {nivel.nivel.numero} · {nivel.nivel.nombre}
              </Text>
              <Text style={s.nivelXP}>
                {progreso.puntosTotales.toLocaleString('es-CO')}
                {nivel.siguiente ? ` / ${nivel.meta.toLocaleString('es-CO')} XP` : ' XP'}
              </Text>
            </View>
            <BarraProgreso valor={nivel.avance} color={colores.amarillo} fondo={colores.amarilloSuave} />
            <Text style={s.nivelFalta}>{nivel.siguiente ? `Te faltan ${nivel.faltan} XP para ${nivel.siguiente.nombre}` : '¡Nivel máximo alcanzado!'}</Text>
          </View>
        </Pressable>

        {/* Lista de hoy */}
        <Seccion
          titulo={`Hoy · ${hechas}/${tareasHoy.length}`}
          accion={
            <Pressable onPress={() => router.push('/tarea/nueva')} style={s.nueva}>
              <Ionicons name="add" size={18} color={colores.verdeProfundo} />
              <Text style={s.nuevaTexto}>Nueva tarea</Text>
            </Pressable>
          }
        >
          {tareasHoy.length === 0 ? (
            <Vacio
              icono="sunny-outline"
              titulo="Aún no tienes tareas para hoy"
              texto="Crea tu primera tarea y empieza a sumar puntos."
              accion={<Boton titulo="Crear mi primera tarea" icono="add" onPress={() => router.push('/tarea/nueva')} />}
            />
          ) : (
            <>
              {pendientes.map((t) => (
                <TareaFila key={t.id} tarea={t} hecha={false} onAlternar={() => onAlternar(t.id)} onAbrir={() => router.push(`/tarea/${t.id}`)} />
              ))}
              {completadas.length > 0 && <Texto v="etiqueta" style={{ marginTop: 10, marginBottom: 8 }}>Completadas</Texto>}
              {completadas.map((t) => (
                <TareaFila key={t.id} tarea={t} hecha onAlternar={() => onAlternar(t.id)} onAbrir={() => router.push(`/tarea/${t.id}`)} />
              ))}
            </>
          )}
        </Seccion>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  saludo: { fontFamily: fuentes.bold, fontSize: 19, color: colores.texto },
  fecha: { fontFamily: fuentes.media, fontSize: 13, color: colores.gris, marginTop: 1 },
  campana: { width: 44, height: 44, borderRadius: 14, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', ...sombra },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colores.rojoSuave, padding: 12, borderRadius: 12, marginBottom: 14 },
  ritmo: { flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: colores.verdeProfundo, borderRadius: radio.xl, padding: 18 },
  pct: { fontFamily: fuentes.extra, fontSize: 28, color: colores.blanco },
  pctEtiqueta: { fontFamily: fuentes.media, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: -2 },
  ritmoTitulo: { fontFamily: fuentes.bold, fontSize: 18, color: colores.blanco },
  ritmoMensaje: { fontFamily: fuentes.media, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  mini: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  miniValor: { fontFamily: fuentes.extra, fontSize: 15, color: colores.blanco },
  miniEtiqueta: { fontFamily: fuentes.media, fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.blanco, borderRadius: radio.l, padding: 16, marginTop: 14, ...sombra },
  nivelIcono: { width: 48, height: 48, borderRadius: 16, backgroundColor: colores.amarillo, alignItems: 'center', justifyContent: 'center' },
  nivelNumero: { fontFamily: fuentes.extra, fontSize: 22, color: colores.verdeProfundo },
  nivelNombre: { fontFamily: fuentes.bold, fontSize: 14, color: colores.texto },
  nivelXP: { fontFamily: fuentes.bold, fontSize: 12, color: colores.gris },
  nivelFalta: { fontFamily: fuentes.media, fontSize: 11, color: colores.gris },
  nueva: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colores.verde, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  nuevaTexto: { fontFamily: fuentes.bold, fontSize: 13, color: colores.verdeProfundo },
});
