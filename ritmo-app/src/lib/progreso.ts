// Motor de progreso de RITMO: puntos, bonificaciones, rachas, niveles y logros.
// Todo se deriva del historial (tareas + cumplimientos), así que siempre es consistente.
import type { Categoria, Cumplimiento, Tarea } from './tipos';
import { diaSemana, rangoDias, sumarDias } from './fechas';

export const BONO_DIA_COMPLETO = 20;
export const BONO_SIETE_DIAS = 50;

export type EstadoDia =
  | 'perfecto' // 100 % de lo programado
  | 'cumplido' // alcanzó la meta diaria
  | 'parcial' // hubo actividad, sin llegar a la meta
  | 'sin' // no hubo actividad
  | 'comodin' // día fallado salvado por el comodín del mes
  | 'libre' // no había nada programado
  | 'pendiente'; // hoy, aún en curso

export interface Dia {
  fecha: string;
  programadas: number;
  completadas: number;
  pct: number; // 0..1
  puntos: number; // puntos de tareas + bonos de ese día
  estado: EstadoDia;
  racha: number; // racha al final del día
}

export interface Bono {
  fecha: string;
  tipo: 'dia_completo' | 'siete_dias';
  puntos: number;
}

export interface Nivel {
  numero: number;
  nombre: string;
  min: number;
  max: number | null; // null = nivel máximo
}

export const NIVELES: Nivel[] = [
  { numero: 1, nombre: 'Inicio', min: 0, max: 99 },
  { numero: 2, nombre: 'Constante', min: 100, max: 299 },
  { numero: 3, nombre: 'Disciplinado', min: 300, max: 599 },
  { numero: 4, nombre: 'Imparable', min: 600, max: 999 },
  { numero: 5, nombre: 'Maestro del ritmo', min: 1000, max: null },
];

export function nivelDe(puntos: number) {
  const nivel = [...NIVELES].reverse().find((n) => puntos >= n.min) ?? NIVELES[0];
  const siguiente = NIVELES.find((n) => n.numero === nivel.numero + 1) ?? null;
  const meta = siguiente ? siguiente.min : nivel.min;
  const avance = siguiente ? (puntos - nivel.min) / (siguiente.min - nivel.min) : 1;
  return { nivel, siguiente, meta, avance: Math.max(0, Math.min(1, avance)), faltan: siguiente ? siguiente.min - puntos : 0 };
}

/** ¿La tarea está programada para esa fecha? */
export function programadaEn(t: Tarea, fecha: string): boolean {
  if (t.creada_en.slice(0, 10) > fecha && !(t.frecuencia === 'una_vez' && t.fecha === fecha)) return false;
  if (t.frecuencia === 'diaria') return true;
  if (t.frecuencia === 'semanal') return t.dias.includes(diaSemana(fecha));
  return t.fecha === fecha;
}

export function tareasDelDia(tareas: Tarea[], fecha: string): Tarea[] {
  return tareas.filter((t) => programadaEn(t, fecha));
}

export interface Progreso {
  dias: Dia[];
  porFecha: Record<string, Dia>;
  rachaActual: number;
  mejorRacha: number;
  puntosTareas: number;
  bonos: Bono[];
  puntosTotales: number;
  totalCumplimientos: number;
  minutosTotales: number;
  comodinDisponible: boolean;
  categoriasCompletadas: Set<Categoria>;
  mejorRachaPerfecta: number;
}

/**
 * Recorre el historial día por día y calcula racha, bonos y estados.
 * Regla de racha: un día suma si se completa al menos `metaPct` % de lo programado (mínimo una tarea).
 * Los días sin nada programado no rompen ni suman. Hoy no rompe la racha mientras está en curso.
 * Comodín: una vez por mes calendario, un día fallado no rompe la racha.
 */
export function calcularProgreso(tareas: Tarea[], cumplimientos: Cumplimiento[], metaPct: number, hoy: string): Progreso {
  const porFechaCumpl: Record<string, Cumplimiento[]> = {};
  for (const c of cumplimientos) (porFechaCumpl[c.fecha] ??= []).push(c);

  const inicios = [
    ...tareas.map((t) => (t.frecuencia === 'una_vez' && t.fecha ? (t.fecha < t.creada_en.slice(0, 10) ? t.fecha : t.creada_en.slice(0, 10)) : t.creada_en.slice(0, 10))),
    ...cumplimientos.map((c) => c.fecha),
  ].filter((f) => f <= hoy);
  const inicio = inicios.length ? inicios.reduce((a, b) => (a < b ? a : b)) : hoy;

  const dias: Dia[] = [];
  const porFecha: Record<string, Dia> = {};
  const bonos: Bono[] = [];
  const comodinUsado = new Set<string>(); // 'YYYY-MM'
  let racha = 0;
  let mejor = 0;
  let rachaPerfecta = 0;
  let mejorPerfecta = 0;

  for (const fecha of rangoDias(inicio, hoy)) {
    const programadas = tareasDelDia(tareas, fecha);
    const hechos = porFechaCumpl[fecha] ?? [];
    const idsProgramadas = new Set(programadas.map((t) => t.id));
    const completadasProg = hechos.filter((c) => c.tarea_id !== null && idsProgramadas.has(c.tarea_id)).length;
    const total = programadas.length;
    const completadas = Math.max(completadasProg, total === 0 ? hechos.length : 0);
    const pct = total > 0 ? Math.min(1, completadasProg / total) : hechos.length > 0 ? 1 : 0;
    let puntos = hechos.reduce((s, c) => s + c.puntos, 0);

    const cumple = hechos.length > 0 && pct * 100 >= metaPct;
    const perfecto = total > 0 && completadasProg >= total;
    let estado: EstadoDia;

    if (total === 0 && hechos.length === 0) {
      estado = fecha === hoy ? 'pendiente' : 'libre';
    } else if (cumple) {
      racha += 1;
      estado = perfecto ? 'perfecto' : 'cumplido';
      if (racha % 7 === 0) {
        bonos.push({ fecha, tipo: 'siete_dias', puntos: BONO_SIETE_DIAS });
        puntos += BONO_SIETE_DIAS;
      }
    } else if (fecha === hoy) {
      estado = 'pendiente';
    } else {
      const mes = fecha.slice(0, 7);
      if (racha > 0 && !comodinUsado.has(mes)) {
        comodinUsado.add(mes);
        estado = 'comodin';
      } else {
        racha = 0;
        estado = hechos.length > 0 ? 'parcial' : 'sin';
      }
    }
    if (perfecto) {
      bonos.push({ fecha, tipo: 'dia_completo', puntos: BONO_DIA_COMPLETO });
      puntos += BONO_DIA_COMPLETO;
      rachaPerfecta += 1;
    } else if (!(total === 0 && hechos.length === 0) && fecha !== hoy) {
      rachaPerfecta = 0;
    }
    mejor = Math.max(mejor, racha);
    mejorPerfecta = Math.max(mejorPerfecta, rachaPerfecta);

    const dia: Dia = { fecha, programadas: total, completadas, pct, puntos, estado, racha };
    dias.push(dia);
    porFecha[fecha] = dia;
  }

  const puntosTareas = cumplimientos.reduce((s, c) => s + c.puntos, 0);
  const puntosBonos = bonos.reduce((s, b) => s + b.puntos, 0);

  return {
    dias,
    porFecha,
    rachaActual: racha,
    mejorRacha: mejor,
    puntosTareas,
    bonos,
    puntosTotales: puntosTareas + puntosBonos,
    totalCumplimientos: cumplimientos.length,
    minutosTotales: cumplimientos.reduce((s, c) => s + (c.duracion_min ?? 0), 0),
    comodinDisponible: !comodinUsado.has(hoy.slice(0, 7)),
    categoriasCompletadas: new Set(cumplimientos.map((c) => c.categoria)),
    mejorRachaPerfecta: mejorPerfecta,
  };
}

// ---------------------------------------------------------------------
// Logros
// ---------------------------------------------------------------------

export interface Logro {
  id: string;
  nombre: string;
  condicion: string;
  icono: string;
  actual: number;
  meta: number;
  completado: boolean;
}

export function calcularLogros(p: Progreso): Logro[] {
  const l = (id: string, nombre: string, condicion: string, icono: string, actual: number, meta: number): Logro => ({
    id,
    nombre,
    condicion,
    icono,
    actual: Math.min(actual, meta),
    meta,
    completado: actual >= meta,
  });
  return [
    l('inicio', 'Inicio', 'Completa tu primera tarea.', 'flag', p.totalCumplimientos, 1),
    l('constante', 'Constante', 'Mantén una racha de 7 días.', 'flame', p.mejorRacha, 7),
    l('enfocado', 'Enfocado', 'Completa 20 tareas.', 'locate', p.totalCumplimientos, 20),
    l('imparable', 'Imparable', 'Mantén una racha de 14 días.', 'rocket', p.mejorRacha, 14),
    l('explorador', 'Explorador', 'Completa tareas de las 4 categorías.', 'compass', p.categoriasCompletadas.size, 4),
    l('semana_perfecta', 'Semana perfecta', 'Completa el 100 % de tus tareas 7 días seguidos.', 'star', p.mejorRachaPerfecta, 7),
    l('maestro', 'Maestro del ritmo', 'Mantén una racha de 30 días.', 'trophy', p.mejorRacha, 30),
    l('alto_rendimiento', 'Alto rendimiento', 'Acumula 1.000 puntos.', 'diamond', p.puntosTotales, 1000),
  ];
}

// ---------------------------------------------------------------------
// Estadísticas por periodo
// ---------------------------------------------------------------------

export type Periodo = 'semana' | 'mes' | 'todo';

export interface Estadisticas {
  desde: string;
  hasta: string;
  serie: { fecha: string; puntos: number }[];
  puntos: number;
  puntosAnterior: number | null;
  variacion: number | null; // porcentaje vs periodo anterior
  completadas: number;
  diasCumplidos: number;
  minutos: number;
  porCategoria: Record<Categoria, number>;
  mejorDia: Dia | null;
}

export function calcularEstadisticas(p: Progreso, cumplimientos: Cumplimiento[], periodo: Periodo, hoy: string): Estadisticas {
  const largo = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : Math.max(p.dias.length, 1);
  const desde = sumarDias(hoy, -(largo - 1));
  const enRango = (f: string, a: string, b: string) => f >= a && f <= b;
  const serie = rangoDias(desde, hoy).map((fecha) => ({ fecha, puntos: p.porFecha[fecha]?.puntos ?? 0 }));
  const puntos = serie.reduce((s, x) => s + x.puntos, 0);

  let puntosAnterior: number | null = null;
  let variacion: number | null = null;
  if (periodo !== 'todo') {
    const aDesde = sumarDias(desde, -largo);
    const aHasta = sumarDias(desde, -1);
    puntosAnterior = rangoDias(aDesde, aHasta).reduce((s, f) => s + (p.porFecha[f]?.puntos ?? 0), 0);
    variacion = puntosAnterior > 0 ? Math.round(((puntos - puntosAnterior) / puntosAnterior) * 100) : null;
  }

  const cs = cumplimientos.filter((c) => enRango(c.fecha, desde, hoy));
  const porCategoria: Record<Categoria, number> = { Estudio: 0, Salud: 0, Trabajo: 0, Personal: 0 };
  for (const c of cs) porCategoria[c.categoria] += 1;
  const diasRango = p.dias.filter((d) => enRango(d.fecha, desde, hoy));
  const mejorDia = diasRango.reduce<Dia | null>((m, d) => (d.puntos > 0 && (!m || d.puntos > m.puntos) ? d : m), null);

  return {
    desde,
    hasta: hoy,
    serie,
    puntos,
    puntosAnterior,
    variacion,
    completadas: cs.length,
    diasCumplidos: diasRango.filter((d) => d.estado === 'cumplido' || d.estado === 'perfecto').length,
    minutos: cs.reduce((s, c) => s + (c.duracion_min ?? 0), 0),
    porCategoria,
    mejorDia,
  };
}
