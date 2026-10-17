export type Rol = 'admin' | 'usuario';
export type Categoria = 'Estudio' | 'Salud' | 'Trabajo' | 'Personal';
export type Frecuencia = 'una_vez' | 'diaria' | 'semanal';
export type Dificultad = 'facil' | 'media' | 'dificil';

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatar_url: string | null;
  meta_diaria: number;
  activo: boolean;
  creado_en: string;
}

export interface Tarea {
  id: number;
  usuario_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: Categoria;
  frecuencia: Frecuencia;
  dias: number[];
  fecha: string | null;
  dificultad: Dificultad;
  puntos: number;
  duracion_min: number | null;
  hora_recordatorio: string | null; // "HH:MM:SS"
  creada_en: string;
  actualizada_en: string;
}

export type TareaNueva = Pick<
  Tarea,
  'nombre' | 'descripcion' | 'categoria' | 'frecuencia' | 'dias' | 'fecha' | 'dificultad' | 'duracion_min' | 'hora_recordatorio'
>;

export interface Cumplimiento {
  id: number;
  usuario_id: string;
  tarea_id: number | null;
  tarea_nombre: string;
  categoria: Categoria;
  fecha: string; // YYYY-MM-DD
  puntos: number;
  duracion_min: number | null;
  creado_en: string;
}

export interface ResumenUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatar_url: string | null;
  activo: boolean;
  creado_en: string;
  puntos: number;
  tareas: number;
  cumplimientos: number;
  ultima_actividad: string | null;
}

export const PUNTOS: Record<Dificultad, number> = { facil: 5, media: 10, dificil: 20 };
export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };
export const NOMBRE_FRECUENCIA: Record<Frecuencia, string> = { una_vez: 'Una vez', diaria: 'Diariamente', semanal: 'Semanalmente' };
export const CATEGORIAS: Categoria[] = ['Estudio', 'Salud', 'Trabajo', 'Personal'];
