import { createClient } from '@supabase/supabase-js';
const URL = 'http://127.0.0.1:54321';
const KEY = process.env.ANON;
const mk = () => createClient(URL, KEY, { auth: { persistSession: false } });
let ok = 0, fail = 0;
const check = (name, cond, extra='') => { if (cond) { ok++; console.log('✓', name); } else { fail++; console.log('✗', name, extra); } };
const s = Date.now();
const today = new Date().toISOString().slice(0,10);

const admin = mk();
let r = await admin.auth.signUp({ email: `admin${s}@ritmo.co`, password: 'secreto1', options: { data: { nombre: 'Ana Admin', rol: 'usuario' } } });
check('autorregistro admin', !r.error, r.error?.message);
let p = await admin.from('perfiles').select('*').single();
// first user may not be admin if DB already has an admin from previous run
console.log('rol primer usuario:', p.data?.rol);

const u = mk();
r = await u.auth.signUp({ email: `user${s}@ritmo.co`, password: 'secreto1', options: { data: { nombre: 'Beto', rol: 'admin' } } });
check('autorregistro usuario', !r.error, r.error?.message);
p = await u.from('perfiles').select('*').single();
check('rol no se puede inyectar en registro', p.data?.rol === 'usuario', JSON.stringify(p));
await u.from('perfiles').update({ rol: 'admin' }).eq('id', p.data.id);
p = await u.from('perfiles').select('*').single();
check('usuario no puede ascenderse a admin', p.data?.rol === 'usuario');
const uid = p.data.id;

// make admin admin if it isn't (previous runs)
const ap = await admin.from('perfiles').select('*').eq('id', (await admin.auth.getUser()).data.user.id).single();
if (ap.data.rol !== 'admin') { console.log('(primer usuario no fue admin: ya existía un admin)'); }

r = await u.rpc('admin_resumen_usuarios');
check('usuario no puede listar usuarios', !!r.error);
r = await u.from('perfiles').select('*');
check('usuario solo ve su perfil', r.data.length === 1);

// tasks CRUD
r = await u.from('tareas').insert({ nombre: 'Estudiar', categoria: 'Estudio', frecuencia: 'diaria', dificultad: 'dificil', duracion_min: 60 }).select().single();
check('crear tarea', !r.error && r.data.puntos === 20, r.error?.message);
const tid = r.data.id;
r = await u.from('tareas').insert({ nombre: '  ', categoria: 'Estudio', frecuencia: 'diaria', dificultad: 'facil' });
check('no crea tarea con nombre vacío', !!r.error);
r = await u.from('tareas').insert({ nombre: 'X', categoria: 'Estudio', frecuencia: 'semanal', dificultad: 'facil' });
check('semanal exige días', !!r.error);
r = await u.from('tareas').select('*');
check('listar tareas', r.data.length === 1);
r = await u.from('tareas').select('*').eq('id', tid).single();
check('consultar tarea por id', r.data?.nombre === 'Estudiar');
r = await u.rpc('completar_tarea', { p_tarea_id: tid, p_fecha: today });
check('completar tarea', !r.error && r.data.puntos === 20, r.error?.message);
r = await u.rpc('completar_tarea', { p_tarea_id: tid, p_fecha: today });
let cs = await u.from('cumplimientos').select('*');
check('completar dos veces no duplica puntos', cs.data.length === 1);
r = await u.rpc('completar_tarea', { p_tarea_id: tid, p_fecha: '2020-01-01' });
check('no marca fechas pasadas', !!r.error);
r = await u.from('tareas').update({ nombre: 'Estudiar React', dificultad: 'media' }).eq('id', tid).select().single();
check('actualizar tarea', r.data?.puntos === 10);
cs = await u.from('cumplimientos').select('*');
check('editar no cambia historial', cs.data[0].puntos === 20);
r = await u.rpc('desmarcar_tarea', { p_tarea_id: tid, p_fecha: today });
cs = await u.from('cumplimientos').select('*');
check('desmarcar retira cumplimiento', cs.data.length === 0);
await u.rpc('completar_tarea', { p_tarea_id: tid, p_fecha: today });
r = await u.from('cumplimientos').insert({ usuario_id: uid, tarea_nombre: 'trampa', categoria: 'Estudio', fecha: today, puntos: 9999 });
check('no se pueden insertar puntos directamente', !!r.error);

// admin
r = await admin.rpc('admin_resumen_usuarios');
if (r.error) { console.log('admin listar error (admin no es admin?):', r.error.message); }
else {
  check('admin lista usuarios', r.data.length >= 2);
  const row = r.data.find(x => x.id === uid);
  check('admin ve puntos del usuario', Number(row.puntos) === 10, JSON.stringify(row));
  r = await admin.rpc('admin_resumen_usuarios', { p_id: uid });
  check('admin consulta por id', r.data.length === 1);
  r = await admin.rpc('admin_crear_usuario', { p_email: `nuevo${s}@ritmo.co`, p_password: 'clave123', p_nombre: 'Carla', p_rol: 'usuario' });
  check('admin registra usuario', !r.error, r.error?.message);
  const nid = r.data;
  const n = mk();
  let li = await n.auth.signInWithPassword({ email: `nuevo${s}@ritmo.co`, password: 'clave123' });
  check('usuario creado por admin puede iniciar sesión', !li.error, li.error?.message);
  r = await admin.rpc('admin_actualizar_usuario', { p_id: nid, p_nombre: 'Carla R', p_email: `carla${s}@ritmo.co`, p_rol: 'usuario', p_activo: true, p_password: 'nueva123' });
  check('admin actualiza usuario', !r.error, r.error?.message);
  li = await mk().auth.signInWithPassword({ email: `carla${s}@ritmo.co`, password: 'nueva123' });
  check('login con correo y clave actualizados', !li.error, li.error?.message);
  r = await admin.rpc('admin_actualizar_usuario', { p_id: nid, p_nombre: 'Carla R', p_email: `carla${s}@ritmo.co`, p_rol: 'usuario', p_activo: false });
  li = await mk().auth.signInWithPassword({ email: `carla${s}@ritmo.co`, password: 'nueva123' });
  check('usuario desactivado no puede entrar', !!li.error);
  r = await admin.rpc('admin_eliminar_usuario', { p_id: nid });
  check('admin elimina usuario', !r.error, r.error?.message);
  r = await admin.rpc('admin_resumen_usuarios', { p_id: nid });
  check('usuario eliminado ya no existe', r.data.length === 0);
  r = await admin.rpc('admin_eliminar_usuario', { p_id: (await admin.auth.getUser()).data.user.id });
  check('admin no se elimina a sí mismo', !!r.error);
  r = await admin.from('tareas').select('*').eq('usuario_id', uid);
  check('admin puede consultar tareas de usuarios', r.data.length === 1);
}
r = await u.rpc('generar_datos_demo');
check('generar datos demo', !r.error, r.error?.message);
cs = await u.from('cumplimientos').select('fecha', { count: 'exact' });
check('demo crea historial', cs.data.length > 10, String(cs.data.length));
await u.auth.signOut();
r = await u.from('tareas').select('*');
check('tras cerrar sesión no ve tareas', (r.data ?? []).length === 0);
console.log(`\n${ok} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
