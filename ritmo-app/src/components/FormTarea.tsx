// Pantalla 03 · Crear / editar tarea
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DIAS_ABREV, DIAS_CORTOS, fechaCorta, hoyISO, sumarDias } from '@/lib/fechas';
import { categorias, colores, fuentes, radio } from '@/lib/tema';
import { CATEGORIAS, PUNTOS, type Categoria, type Dificultad, type Frecuencia, type Tarea, type TareaNueva } from '@/lib/tipos';
import { Boton, Campo, Chip, Interruptor, Texto, type IconName } from './ui';

const DURACIONES = [null, 15, 20, 30, 45, 60, 90, 120];

export function FormTarea({
  inicial,
  textoBoton,
  onGuardar,
  onCancelar,
}: {
  inicial?: Tarea;
  textoBoton: string;
  onGuardar: (t: TareaNueva) => Promise<void>;
  onCancelar: () => void;
}) {
  const hoy = hoyISO();
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? 'Estudio');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(inicial?.frecuencia ?? 'diaria');
  const [dias, setDias] = useState<number[]>(inicial?.dias?.length ? inicial.dias : [1, 3, 5]);
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy);
  const [dificultad, setDificultad] = useState<Dificultad>(inicial?.dificultad ?? 'media');
  const [duracion, setDuracion] = useState<number | null>(inicial?.duracion_min ?? null);
  const [conHora, setConHora] = useState(!!inicial?.hora_recordatorio);
  const [hora, setHora] = useState(inicial?.hora_recordatorio ? Number(inicial.hora_recordatorio.slice(0, 2)) : 8);
  const [minuto, setMinuto] = useState(inicial?.hora_recordatorio ? Number(inicial.hora_recordatorio.slice(3, 5)) : 0);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const fechas = Array.from({ length: 14 }, (_, i) => sumarDias(hoy, i));
  if (inicial?.fecha && !fechas.includes(inicial.fecha)) fechas.unshift(inicial.fecha);

  const guardar = async () => {
    if (!nombre.trim()) return setError('Escribe el nombre de la tarea.');
    if (frecuencia === 'semanal' && dias.length === 0) return setError('Elige al menos un día de la semana.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria,
        frecuencia,
        dias: frecuencia === 'semanal' ? [...dias].sort() : [],
        fecha: frecuencia === 'una_vez' ? fecha : null,
        dificultad,
        duracion_min: duracion,
        hora_recordatorio: conHora ? `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00` : null,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View>
      <Campo
        etiqueta="Nombre de la tarea"
        placeholder="Ej. Estudiar 1 hora"
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          if (error) setError(null);
        }}
        maxLength={80}
        error={error && !nombre.trim() ? error : null}
        icono="create-outline"
      />
      <Campo etiqueta="Descripción (opcional)" placeholder="¿Algún detalle?" value={descripcion} onChangeText={setDescripcion} maxLength={300} icono="document-text-outline" />

      <Texto v="etiqueta" style={s.etiqueta}>
        Categoría
      </Texto>
      <View style={s.grupo}>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            texto={c}
            icono={categorias[c].icono as IconName}
            activo={categoria === c}
            color={categorias[c].color}
            fondo={categorias[c].fondo}
            onPress={() => setCategoria(c)}
          />
        ))}
      </View>

      <Texto v="etiqueta" style={s.etiqueta}>
        Frecuencia
      </Texto>
      <View style={s.grupo}>
        {(
          [
            ['una_vez', 'Una vez'],
            ['diaria', 'Diariamente'],
            ['semanal', 'Semanalmente'],
          ] as const
        ).map(([v, t]) => (
          <Chip key={v} texto={t} activo={frecuencia === v} onPress={() => setFrecuencia(v)} />
        ))}
      </View>

      {frecuencia === 'semanal' && (
        <View style={[s.grupo, { gap: 6, marginTop: -4 }]}>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const activo = dias.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityLabel={DIAS_ABREV[d]}
                accessibilityState={{ selected: activo }}
                onPress={() => setDias(activo ? dias.filter((x) => x !== d) : [...dias, d])}
                style={[s.dia, activo && s.diaActivo]}
              >
                <Text style={[s.diaTexto, activo && { color: colores.blanco }]}>{DIAS_CORTOS[d]}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {frecuencia === 'una_vez' && (
        <View style={[s.grupo, { marginTop: -4 }]}>
          {fechas.slice(0, 8).map((f) => (
            <Chip key={f} texto={f === hoy ? 'Hoy' : f === sumarDias(hoy, 1) ? 'Mañana' : fechaCorta(f)} activo={fecha === f} onPress={() => setFecha(f)} />
          ))}
        </View>
      )}

      <Texto v="etiqueta" style={s.etiqueta}>
        Dificultad
      </Texto>
      <View style={s.grupo}>
        {(
          [
            ['facil', 'Fácil'],
            ['media', 'Media'],
            ['dificil', 'Difícil'],
          ] as const
        ).map(([v, t]) => (
          <Pressable key={v} onPress={() => setDificultad(v)} style={[s.dificultad, dificultad === v && s.dificultadActiva]}>
            <Text style={[s.dificultadTitulo, dificultad === v && { color: colores.verdeProfundo }]}>{t}</Text>
            <Text style={[s.dificultadPuntos, dificultad === v && { color: colores.verdeOscuro }]}>+{PUNTOS[v]} pts</Text>
          </Pressable>
        ))}
      </View>

      <Texto v="etiqueta" style={s.etiqueta}>
        Duración (para tus estadísticas)
      </Texto>
      <View style={s.grupo}>
        {DURACIONES.map((d) => (
          <Chip key={String(d)} texto={d ? `${d} min` : 'Sin duración'} activo={duracion === d} onPress={() => setDuracion(d)} />
        ))}
      </View>

      <View style={s.recordatorio}>
        <Ionicons name="alarm-outline" size={22} color={colores.verdeOscuro} />
        <View style={{ flex: 1 }}>
          <Text style={s.recTitulo}>Recordatorio</Text>
          <Text style={s.recTexto}>Te avisamos con una notificación</Text>
        </View>
        <Interruptor valor={conHora} onCambio={setConHora} />
      </View>
      {conHora && (
        <View style={s.selectorHora}>
          <Contador valor={hora} min={0} max={23} onCambio={setHora} />
          <Text style={s.dosPuntos}>:</Text>
          <Contador valor={minuto} min={0} max={55} paso={5} onCambio={setMinuto} />
        </View>
      )}

      {error && nombre.trim() ? <Text style={s.error}>{error}</Text> : null}
      <Boton titulo={textoBoton} icono="checkmark-circle" onPress={guardar} cargando={guardando} style={{ marginTop: 24 }} />
      <Boton titulo="Cancelar" tipo="texto" onPress={onCancelar} style={{ marginTop: 6 }} />
    </View>
  );
}

function Contador({ valor, min, max, paso = 1, onCambio }: { valor: number; min: number; max: number; paso?: number; onCambio: (v: number) => void }) {
  const mover = (d: number) => {
    let v = valor + d * paso;
    if (v > max) v = min;
    if (v < min) v = max - ((max - min) % paso);
    onCambio(v);
  };
  return (
    <View style={s.contador}>
      <Pressable accessibilityLabel="Subir" hitSlop={8} onPress={() => mover(1)}>
        <Ionicons name="chevron-up" size={24} color={colores.verdeOscuro} />
      </Pressable>
      <Text style={s.contadorValor}>{String(valor).padStart(2, '0')}</Text>
      <Pressable accessibilityLabel="Bajar" hitSlop={8} onPress={() => mover(-1)}>
        <Ionicons name="chevron-down" size={24} color={colores.verdeOscuro} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  etiqueta: { marginBottom: 8, marginTop: 6 },
  grupo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dia: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.blanco, borderWidth: 1.5, borderColor: colores.grisClaro, alignItems: 'center', justifyContent: 'center' },
  diaActivo: { backgroundColor: colores.verdeOscuro, borderColor: colores.verdeOscuro },
  diaTexto: { fontFamily: fuentes.bold, fontSize: 14, color: colores.texto },
  dificultad: { flex: 1, minWidth: 90, backgroundColor: colores.blanco, borderRadius: radio.m, borderWidth: 1.5, borderColor: colores.grisClaro, paddingVertical: 12, alignItems: 'center' },
  dificultadActiva: { backgroundColor: colores.verdeSuave, borderColor: colores.verde },
  dificultadTitulo: { fontFamily: fuentes.bold, fontSize: 15, color: colores.texto },
  dificultadPuntos: { fontFamily: fuentes.semi, fontSize: 12, color: colores.gris, marginTop: 2 },
  recordatorio: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.blanco, borderRadius: radio.m, padding: 14, marginTop: 4 },
  recTitulo: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  recTexto: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris },
  selectorHora: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  contador: { alignItems: 'center', backgroundColor: colores.blanco, borderRadius: radio.m, paddingVertical: 6, width: 78 },
  contadorValor: { fontFamily: fuentes.extra, fontSize: 30, color: colores.texto },
  dosPuntos: { fontFamily: fuentes.extra, fontSize: 30, color: colores.texto },
  error: { fontFamily: fuentes.semi, fontSize: 13, color: colores.rojo, marginTop: 14 },
});
