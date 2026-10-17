// Mejora: onboarding de 3 pasos (áreas → tareas sugeridas → meta diaria)
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, Pantalla, Texto, type IconName } from '@/components/ui';
import { useDatos } from '@/context/Datos';
import { useSesion } from '@/context/Sesion';
import { actualizarMiPerfil } from '@/lib/api';
import { marcarOnboarding } from '@/lib/onboarding';
import { pedirPermiso } from '@/lib/notificaciones';
import { categorias, colores, fuentes, radio } from '@/lib/tema';
import { CATEGORIAS, PUNTOS, type Categoria, type TareaNueva } from '@/lib/tipos';

const SUGERENCIAS: Record<Categoria, TareaNueva[]> = {
  Estudio: [
    t('Estudiar programación', 'Estudio', 'media', 60, '19:00:00'),
    t('Repasar apuntes de clase', 'Estudio', 'facil', 20, null),
  ],
  Salud: [
    t('Hacer ejercicio', 'Salud', 'dificil', 45, '07:00:00', [1, 3, 5]),
    t('Tomar 8 vasos de agua', 'Salud', 'facil', null, null),
    t('Dormir antes de las 11', 'Salud', 'media', null, '22:30:00'),
  ],
  Trabajo: [t('Revisar pendientes del día', 'Trabajo', 'media', 30, '08:00:00', [1, 2, 3, 4, 5]), t('Responder correos', 'Trabajo', 'facil', 15, null)],
  Personal: [t('Leer 20 minutos', 'Personal', 'facil', 20, '21:30:00'), t('Organizar habitación', 'Personal', 'facil', 15, null, [6])],
};

function t(nombre: string, categoria: Categoria, dificultad: TareaNueva['dificultad'], duracion: number | null, hora: string | null, dias: number[] = []): TareaNueva {
  return {
    nombre,
    descripcion: null,
    categoria,
    dificultad,
    duracion_min: duracion,
    hora_recordatorio: hora,
    frecuencia: dias.length ? 'semanal' : 'diaria',
    dias,
    fecha: null,
  };
}

const METAS = [
  { valor: 30, titulo: 'Suave', texto: 'Cumplir el 30 % de tus tareas mantiene la racha' },
  { valor: 50, titulo: 'Equilibrado', texto: 'La mitad de tus tareas del día' },
  { valor: 80, titulo: 'Exigente', texto: 'Casi todo, todos los días' },
];

export default function Onboarding() {
  const { perfil, setPerfil } = useSesion();
  const { crear } = useDatos();
  const [paso, setPaso] = useState(0);
  const [areas, setAreas] = useState<Categoria[]>(['Estudio', 'Salud']);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState(50);
  const [guardando, setGuardando] = useState(false);

  const sugeridas = areas.flatMap((a) => SUGERENCIAS[a]);

  const siguiente = () => {
    if (paso === 0) setElegidas(new Set(sugeridas.map((s) => s.nombre)));
    setPaso(paso + 1);
  };

  const terminar = async () => {
    if (!perfil) return;
    setGuardando(true);
    try {
      for (const s of sugeridas.filter((s) => elegidas.has(s.nombre))) await crear(s);
      setPerfil(await actualizarMiPerfil(perfil.id, { meta_diaria: meta }));
      await marcarOnboarding(perfil.id);
      await pedirPermiso().catch(() => false);
      router.replace('/(tabs)');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla>
      <View style={s.puntos}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.punto, i <= paso && { backgroundColor: colores.verde, width: i === paso ? 28 : 10 }]} />
        ))}
      </View>

      {paso === 0 && (
        <>
          <Texto v="titulo">Hola, {perfil?.nombre.split(' ')[0]} 👋</Texto>
          <Texto v="cuerpo" color={colores.gris} style={{ marginTop: 6, marginBottom: 22 }}>
            ¿En qué áreas quieres mejorar? Elige todas las que quieras.
          </Texto>
          <View style={{ gap: 12 }}>
            {CATEGORIAS.map((c) => {
              const activo = areas.includes(c);
              const cat = categorias[c];
              return (
                <Pressable key={c} onPress={() => setAreas(activo ? areas.filter((x) => x !== c) : [...areas, c])} style={[s.area, activo && { borderColor: cat.color, backgroundColor: cat.fondo }]}>
                  <View style={[s.areaIcono, { backgroundColor: activo ? cat.color : cat.fondo }]}>
                    <Ionicons name={cat.icono as IconName} size={22} color={activo ? colores.blanco : cat.color} />
                  </View>
                  <Text style={s.areaTexto}>{c}</Text>
                  <Ionicons name={activo ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={activo ? cat.color : colores.grisClaro} />
                </Pressable>
              );
            })}
          </View>
          <Boton titulo="Continuar" onPress={siguiente} deshabilitado={areas.length === 0} style={{ marginTop: 28 }} />
        </>
      )}

      {paso === 1 && (
        <>
          <Texto v="titulo">Tus primeras tareas</Texto>
          <Texto v="cuerpo" color={colores.gris} style={{ marginTop: 6, marginBottom: 22 }}>
            Te sugerimos estas. Quita las que no quieras; luego puedes editarlas o crear más.
          </Texto>
          {sugeridas.map((sg) => {
            const activo = elegidas.has(sg.nombre);
            return (
              <Pressable
                key={sg.nombre}
                onPress={() => {
                  const n = new Set(elegidas);
                  if (activo) n.delete(sg.nombre);
                  else n.add(sg.nombre);
                  setElegidas(n);
                }}
                style={[s.sugerencia, activo && { borderColor: colores.verde }]}
              >
                <Ionicons name={activo ? 'checkbox' : 'square-outline'} size={24} color={activo ? colores.verde : colores.gris} />
                <View style={{ flex: 1 }}>
                  <Text style={s.sugNombre}>{sg.nombre}</Text>
                  <Text style={s.sugMeta}>
                    {sg.categoria} · {sg.frecuencia === 'diaria' ? 'Todos los días' : 'Algunos días'}
                    {sg.duracion_min ? ` · ${sg.duracion_min} min` : ''}
                  </Text>
                </View>
                <Text style={s.sugPuntos}>+{PUNTOS[sg.dificultad]}</Text>
              </Pressable>
            );
          })}
          <Boton titulo="Continuar" onPress={siguiente} style={{ marginTop: 20 }} />
          <Boton titulo="Atrás" tipo="texto" onPress={() => setPaso(0)} />
        </>
      )}

      {paso === 2 && (
        <>
          <Texto v="titulo">Tu meta diaria</Texto>
          <Texto v="cuerpo" color={colores.gris} style={{ marginTop: 6, marginBottom: 22 }}>
            Define qué cuenta como un buen día para tu racha. La constancia importa más que la perfección.
          </Texto>
          <View style={{ gap: 12 }}>
            {METAS.map((m) => (
              <Pressable key={m.valor} onPress={() => setMeta(m.valor)} style={[s.area, meta === m.valor && { borderColor: colores.verde, backgroundColor: colores.verdeSuave }]}>
                <Text style={s.metaPct}>{m.valor}%</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.areaTexto}>{m.titulo}</Text>
                  <Text style={s.sugMeta}>{m.texto}</Text>
                </View>
                <Ionicons name={meta === m.valor ? 'radio-button-on' : 'radio-button-off'} size={22} color={meta === m.valor ? colores.verdeOscuro : colores.grisClaro} />
              </Pressable>
            ))}
          </View>
          <View style={s.comodin}>
            <Text style={{ fontSize: 24 }}>🛟</Text>
            <Text style={[s.sugMeta, { flex: 1, color: colores.verdeOscuro }]}>
              Cada mes tienes un <Text style={{ fontFamily: fuentes.bold }}>comodín</Text>: si un día no alcanzas la meta, tu racha no se pierde.
            </Text>
          </View>
          <Boton titulo="Empezar mi ritmo" icono="rocket-outline" onPress={terminar} cargando={guardando} style={{ marginTop: 24 }} />
          <Boton titulo="Atrás" tipo="texto" onPress={() => setPaso(1)} />
        </>
      )}
    </Pantalla>
  );
}

const s = StyleSheet.create({
  puntos: { flexDirection: 'row', gap: 6, marginBottom: 28, marginTop: 8 },
  punto: { height: 10, width: 10, borderRadius: 5, backgroundColor: colores.grisClaro },
  area: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.blanco, borderRadius: radio.l, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  areaIcono: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  areaTexto: { flex: 1, fontFamily: fuentes.bold, fontSize: 16, color: colores.texto },
  sugerencia: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.blanco, borderRadius: radio.m, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  sugNombre: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  sugMeta: { fontFamily: fuentes.media, fontSize: 12, color: colores.gris, marginTop: 2 },
  sugPuntos: { fontFamily: fuentes.extra, fontSize: 14, color: colores.verdeOscuro },
  metaPct: { fontFamily: fuentes.extra, fontSize: 20, color: colores.verdeOscuro, width: 56 },
  comodin: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.verdeSuave, borderRadius: radio.m, padding: 14, marginTop: 18 },
});
