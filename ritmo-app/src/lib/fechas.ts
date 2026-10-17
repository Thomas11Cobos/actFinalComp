// Utilidades de fecha en hora local. Las fechas se guardan como 'YYYY-MM-DD'.

const dos = (n: number) => String(n).padStart(2, '0');

export function aISO(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function desdeISO(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hoyISO(): string {
  return aISO(new Date());
}

export function sumarDias(iso: string, n: number): string {
  const d = desdeISO(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

export function diaSemana(iso: string): number {
  return desdeISO(iso).getDay(); // 0 = domingo
}

export function rangoDias(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) out.push(d);
  return out;
}

export const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DIAS_ABREV = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function fechaLarga(iso: string): string {
  const d = desdeISO(iso);
  return `${DIAS_NOMBRE[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function fechaCorta(iso: string): string {
  const d = desdeISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

export function horaCorta(hora: string | null): string {
  if (!hora) return '';
  const [h, m] = hora.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dos(m)} ${sufijo}`;
}

export function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
