import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as api from '@/lib/api';
import { hoyISO } from '@/lib/fechas';
import { leerPrefs, reprogramar } from '@/lib/notificaciones';
import { calcularLogros, calcularProgreso, nivelDe, tareasDelDia, type Logro, type Progreso } from '@/lib/progreso';
import type { Cumplimiento, Tarea, TareaNueva } from '@/lib/tipos';
import { useSesion } from './Sesion';

export interface Celebracion {
  tarea: Tarea;
  puntos: number;
  bonoDia: boolean;
  nuevoNivel: { numero: number; nombre: string } | null;
  nuevosLogros: Logro[];
  rachaActual: number;
  mejorRacha: number;
}

interface DatosCtx {
  cargando: boolean;
  error: string | null;
  hoy: string;
  tareas: Tarea[];
  cumplimientos: Cumplimiento[];
  progreso: Progreso;
  logros: Logro[];
  nivel: ReturnType<typeof nivelDe>;
  tareasHoy: Tarea[];
  completadaHoy: (id: number) => boolean;
  recargar: () => Promise<void>;
  crear: (t: TareaNueva) => Promise<Tarea>;
  actualizar: (id: number, t: Partial<TareaNueva>) => Promise<Tarea>;
  eliminar: (id: number) => Promise<void>;
  alternar: (t: Tarea) => Promise<Celebracion | null>;
  celebracion: Celebracion | null;
  cerrarCelebracion: () => void;
}

const Ctx = createContext<DatosCtx | null>(null);

export function DatosProvider({ children }: { children: ReactNode }) {
  const { perfil } = useSesion();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cumplimientos, setCumplimientos] = useState<Cumplimiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebracion, setCelebracion] = useState<Celebracion | null>(null);
  const [hoy, setHoy] = useState(hoyISO());
  const usuarioId = perfil?.id;
  const meta = perfil?.meta_diaria ?? 50;

  // Si la app queda abierta pasada la medianoche, cambia el día.
  useEffect(() => {
    const id = setInterval(() => setHoy(hoyISO()), 60_000);
    return () => clearInterval(id);
  }, []);

  const recargar = useCallback(async () => {
    if (!usuarioId) return;
    setCargando(true);
    setError(null);
    try {
      const [t, c] = await Promise.all([api.listarTareas(usuarioId), api.listarCumplimientos(usuarioId)]);
      setTareas(t);
      setCumplimientos(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId) recargar();
    else {
      setTareas([]);
      setCumplimientos([]);
    }
  }, [usuarioId, recargar]);

  // Reprograma los recordatorios cuando cambian las tareas.
  const primeraCarga = useRef(true);
  useEffect(() => {
    if (!usuarioId) return;
    if (primeraCarga.current && tareas.length === 0) return;
    primeraCarga.current = false;
    leerPrefs().then((p) => reprogramar(tareas, p)).catch(() => {});
  }, [tareas, usuarioId]);

  const progreso = useMemo(() => calcularProgreso(tareas, cumplimientos, meta, hoy), [tareas, cumplimientos, meta, hoy]);
  const logros = useMemo(() => calcularLogros(progreso), [progreso]);
  const nivel = useMemo(() => nivelDe(progreso.puntosTotales), [progreso.puntosTotales]);
  const tareasHoy = useMemo(
    () => tareasDelDia(tareas, hoy).sort((a, b) => (a.hora_recordatorio ?? '99').localeCompare(b.hora_recordatorio ?? '99')),
    [tareas, hoy],
  );
  const hechasHoy = useMemo(() => new Set(cumplimientos.filter((c) => c.fecha === hoy).map((c) => c.tarea_id)), [cumplimientos, hoy]);
  const completadaHoy = useCallback((id: number) => hechasHoy.has(id), [hechasHoy]);

  const crear = useCallback(async (t: TareaNueva) => {
    const nueva = await api.crearTarea(t);
    setTareas((ts) => [...ts, nueva]);
    return nueva;
  }, []);

  const actualizar = useCallback(async (id: number, t: Partial<TareaNueva>) => {
    const act = await api.actualizarTarea(id, t);
    setTareas((ts) => ts.map((x) => (x.id === id ? act : x)));
    return act;
  }, []);

  const eliminar = useCallback(async (id: number) => {
    await api.eliminarTarea(id);
    setTareas((ts) => ts.filter((x) => x.id !== id));
    // el historial se conserva; solo se desvincula de la tarea
    setCumplimientos((cs) => cs.map((c) => (c.tarea_id === id ? { ...c, tarea_id: null } : c)));
  }, []);

  const alternar = useCallback(
    async (t: Tarea): Promise<Celebracion | null> => {
      if (hechasHoy.has(t.id)) {
        setCumplimientos((cs) => cs.filter((c) => !(c.tarea_id === t.id && c.fecha === hoy)));
        try {
          await api.desmarcarTarea(t.id, hoy);
        } catch (e) {
          await recargar();
          throw e;
        }
        return null;
      }
      const c = await api.completarTarea(t.id, hoy);
      const nuevos = [...cumplimientos.filter((x) => x.id !== c.id), c];
      const antes = progreso;
      const despues = calcularProgreso(tareas, nuevos, meta, hoy);
      const nivelAntes = nivelDe(antes.puntosTotales).nivel.numero;
      const nivelDespues = nivelDe(despues.puntosTotales).nivel;
      const logrosAntes = new Set(calcularLogros(antes).filter((l) => l.completado).map((l) => l.id));
      const cel: Celebracion = {
        tarea: t,
        puntos: despues.puntosTotales - antes.puntosTotales,
        bonoDia: despues.porFecha[hoy]?.estado === 'perfecto',
        nuevoNivel: nivelDespues.numero > nivelAntes ? nivelDespues : null,
        nuevosLogros: calcularLogros(despues).filter((l) => l.completado && !logrosAntes.has(l.id)),
        rachaActual: despues.rachaActual,
        mejorRacha: despues.mejorRacha,
      };
      setCumplimientos(nuevos);
      setCelebracion(cel);
      return cel;
    },
    [hechasHoy, hoy, cumplimientos, progreso, tareas, meta, recargar],
  );

  return (
    <Ctx.Provider
      value={{
        cargando,
        error,
        hoy,
        tareas,
        cumplimientos,
        progreso,
        logros,
        nivel,
        tareasHoy,
        completadaHoy,
        recargar,
        crear,
        actualizar,
        eliminar,
        alternar,
        celebracion,
        cerrarCelebracion: () => setCelebracion(null),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDatos() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDatos fuera de DatosProvider');
  return c;
}
