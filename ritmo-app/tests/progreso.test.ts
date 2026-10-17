import { calcularProgreso, calcularLogros, nivelDe, calcularEstadisticas } from '../src/lib/progreso';
import type { Tarea, Cumplimiento } from '../src/lib/tipos';
let ok = 0, fail = 0;
const check = (n: string, c: boolean, x: unknown = '') => { c ? ok++ : fail++; console.log(c ? '✓' : '✗', n, c ? '' : JSON.stringify(x)); };
const T = (id: number, extra: Partial<Tarea> = {}): Tarea => ({ id, usuario_id: 'u', nombre: 't' + id, descripcion: null, categoria: 'Estudio', frecuencia: 'diaria', dias: [], fecha: null, dificultad: 'media', puntos: 10, duracion_min: 30, hora_recordatorio: null, creada_en: '2026-10-01T10:00:00Z', actualizada_en: '', ...extra });
let cid = 1;
const C = (tarea: Tarea, fecha: string): Cumplimiento => ({ id: cid++, usuario_id: 'u', tarea_id: tarea.id, tarea_nombre: tarea.nombre, categoria: tarea.categoria, fecha, puntos: tarea.puntos, duracion_min: tarea.duracion_min, creado_en: '' });
const a = T(1), b = T(2, { dificultad: 'facil', puntos: 5, categoria: 'Salud' });
const dias = (d1: number, d2: number) => Array.from({ length: d2 - d1 + 1 }, (_, i) => `2026-10-${String(d1 + i).padStart(2, '0')}`);

// 7 días perfectos (1..7) -> racha 7, bono 7 días + 7 bonos día completo
let cs = dias(1, 7).flatMap((f) => [C(a, f), C(b, f)]);
let p = calcularProgreso([a, b], cs, 50, '2026-10-08');
check('racha 7 con hoy pendiente', p.rachaActual === 7, p.rachaActual);
check('puntos = 7*15 + 7*20 + 50', p.puntosTotales === 105 + 140 + 50, p.puntosTotales);
check('hoy pendiente', p.porFecha['2026-10-08'].estado === 'pendiente');
// día 8 sin nada, día 9 cumplido: comodín protege
cs = [...cs, C(a, '2026-10-09')];
p = calcularProgreso([a, b], cs, 50, '2026-10-09');
check('comodín usado el día 8', p.porFecha['2026-10-08'].estado === 'comodin', p.porFecha['2026-10-08']);
check('racha continúa a 8', p.rachaActual === 8, p.rachaActual);
check('día 9 cumplido (50%)', p.porFecha['2026-10-09'].estado === 'cumplido');
check('comodín no disponible este mes', p.comodinDisponible === false);
// día 10 nada, día 11 consulta -> racha rota
p = calcularProgreso([a, b], cs, 50, '2026-10-11');
check('segundo fallo rompe racha', p.rachaActual === 0 && p.porFecha['2026-10-10'].estado === 'sin', p.porFecha['2026-10-10']);
check('mejor racha se conserva', p.mejorRacha === 8);
// meta 100% => 50% no cuenta
p = calcularProgreso([a, b], cs, 100, '2026-10-09');
check('con meta 100%, día 9 es parcial (comodín ya usado el 8)', p.porFecha['2026-10-09'].estado !== 'cumplido', p.porFecha['2026-10-09']);
// semanal: solo cuenta los días programados
const sem = T(3, { frecuencia: 'semanal', dias: [1], creada_en: '2026-10-01T00:00:00Z' }); // lunes
p = calcularProgreso([sem], [C(sem, '2026-10-05')], 50, '2026-10-11');
check('días sin programar son libres', p.porFecha['2026-10-06'].estado === 'libre');
check('racha semanal = 1', p.rachaActual === 1, p.rachaActual);
// tarea creada hoy no afecta días pasados
const nueva = T(4, { creada_en: '2026-10-11T08:00:00Z' });
p = calcularProgreso([nueva], [], 50, '2026-10-11');
check('sin historial no rompe nada', p.dias.length === 1 && p.rachaActual === 0);
// niveles
check('nivel 0 = Inicio', nivelDe(0).nivel.nombre === 'Inicio');
check('nivel 780 = Imparable, 78% a 1000', nivelDe(780).nivel.numero === 4 && Math.abs(nivelDe(780).avance - 0.45) < 0.01, nivelDe(780));
check('nivel 1000 = Maestro', nivelDe(1000).nivel.numero === 5 && nivelDe(1000).avance === 1);
// logros
const lg = calcularLogros(calcularProgreso([a, b], dias(1, 7).flatMap((f) => [C(a, f), C(b, f)]), 50, '2026-10-07'));
check('logro inicio', lg.find((l) => l.id === 'inicio')!.completado);
check('logro constante (7 días)', lg.find((l) => l.id === 'constante')!.completado);
check('semana perfecta', lg.find((l) => l.id === 'semana_perfecta')!.completado);
check('imparable no', !lg.find((l) => l.id === 'imparable')!.completado);
// estadísticas
const pp = calcularProgreso([a, b], dias(1, 14).flatMap((f) => [C(a, f)]), 50, '2026-10-14');
const e = calcularEstadisticas(pp, dias(1, 14).flatMap((f) => [C(a, f)]), 'semana', '2026-10-14');
check('estadística semana: 7 completadas', e.completadas === 7, e.completadas);
check('minutos = 7*30', e.minutos === 210);
check('serie de 7 días', e.serie.length === 7);
console.log(`\n${ok} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
