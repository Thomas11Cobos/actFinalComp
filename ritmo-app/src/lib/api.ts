// Capa de acceso a la API REST de Supabase (PostgREST + Auth + Storage).
import { supabase } from './supabase';
import type { Cumplimiento, Perfil, ResumenUsuario, Rol, Tarea, TareaNueva } from './tipos';

function ok<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

// ---------------- MÓDULO USUARIOS ----------------

export async function iniciarSesion(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
}

export async function registrarse(nombre: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { nombre: nombre.trim() } },
  });
  if (error) throw error;
  return { necesitaConfirmar: !data.session };
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}

export async function obtenerPerfil(id: string): Promise<Perfil> {
  return ok(await supabase.from('perfiles').select('*').eq('id', id).single());
}

export async function actualizarMiPerfil(id: string, cambios: Partial<Pick<Perfil, 'nombre' | 'avatar_url' | 'meta_diaria'>>) {
  return ok<Perfil>(await supabase.from('perfiles').update(cambios).eq('id', id).select().single());
}

export async function cambiarMiContrasena(nueva: string) {
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) throw error;
}

export async function subirAvatar(usuarioId: string, uri: string, mime = 'image/jpeg'): Promise<string> {
  const ext = mime.includes('png') ? 'png' : 'jpg';
  const ruta = `${usuarioId}/avatar.${ext}`;
  const buffer = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('avatars').upload(ruta, buffer, { contentType: mime, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(ruta);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Funciones de administrador
export async function adminListarUsuarios(): Promise<ResumenUsuario[]> {
  return ok(await supabase.rpc('admin_resumen_usuarios'));
}

export async function adminConsultarUsuario(id: string): Promise<ResumenUsuario | null> {
  const filas = ok<ResumenUsuario[]>(await supabase.rpc('admin_resumen_usuarios', { p_id: id }));
  return filas[0] ?? null;
}

export async function adminRegistrarUsuario(datos: { nombre: string; email: string; password: string; rol: Rol }) {
  return ok<string>(
    await supabase.rpc('admin_crear_usuario', {
      p_email: datos.email,
      p_password: datos.password,
      p_nombre: datos.nombre,
      p_rol: datos.rol,
    }),
  );
}

export async function adminActualizarUsuario(datos: { id: string; nombre: string; email: string; rol: Rol; activo: boolean; password?: string }) {
  ok(
    await supabase.rpc('admin_actualizar_usuario', {
      p_id: datos.id,
      p_nombre: datos.nombre,
      p_email: datos.email,
      p_rol: datos.rol,
      p_activo: datos.activo,
      p_password: datos.password || null,
    }),
  );
}

export async function adminEliminarUsuario(id: string) {
  ok(await supabase.rpc('admin_eliminar_usuario', { p_id: id }));
}

export async function adminTareasDeUsuario(id: string): Promise<Tarea[]> {
  return ok(await supabase.from('tareas').select('*').eq('usuario_id', id).order('creada_en'));
}

// ---------------- MÓDULO TAREAS ----------------

export async function listarTareas(usuarioId: string): Promise<Tarea[]> {
  return ok(await supabase.from('tareas').select('*').eq('usuario_id', usuarioId).order('creada_en'));
}

export async function consultarTarea(id: number): Promise<Tarea> {
  return ok(await supabase.from('tareas').select('*').eq('id', id).single());
}

export async function crearTarea(t: TareaNueva): Promise<Tarea> {
  return ok(await supabase.from('tareas').insert(t).select().single());
}

export async function actualizarTarea(id: number, t: Partial<TareaNueva>): Promise<Tarea> {
  return ok(await supabase.from('tareas').update(t).eq('id', id).select().single());
}

export async function eliminarTarea(id: number) {
  ok(await supabase.from('tareas').delete().eq('id', id));
}

export async function listarCumplimientos(usuarioId: string): Promise<Cumplimiento[]> {
  return ok(await supabase.from('cumplimientos').select('*').eq('usuario_id', usuarioId).order('fecha'));
}

export async function completarTarea(tareaId: number, fecha: string): Promise<Cumplimiento> {
  return ok(await supabase.rpc('completar_tarea', { p_tarea_id: tareaId, p_fecha: fecha }));
}

export async function desmarcarTarea(tareaId: number, fecha: string) {
  ok(await supabase.rpc('desmarcar_tarea', { p_tarea_id: tareaId, p_fecha: fecha }));
}

export async function generarDatosDemo(hoy: string) {
  ok(await supabase.rpc('generar_datos_demo', { p_hoy: hoy }));
}
