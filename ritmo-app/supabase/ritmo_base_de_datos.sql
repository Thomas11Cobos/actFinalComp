-- =====================================================================
-- RITMO · Base de datos (Supabase / PostgreSQL)
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.
-- Crea: tablas, seguridad por filas (RLS), funciones de la API y el
-- almacenamiento de fotos de perfil.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------

-- Perfil de cada usuario (1 a 1 con auth.users)
create table if not exists public.perfiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  nombre          text not null check (length(trim(nombre)) between 1 and 60),
  email           text not null,
  rol             text not null default 'usuario' check (rol in ('admin', 'usuario')),
  avatar_url      text,
  meta_diaria     int  not null default 50 check (meta_diaria between 10 and 100),
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Tareas y hábitos
create table if not exists public.tareas (
  id                 bigint generated always as identity primary key,
  usuario_id         uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre             text not null check (length(trim(nombre)) between 1 and 80),
  descripcion        text check (descripcion is null or length(descripcion) <= 300),
  categoria          text not null check (categoria in ('Estudio', 'Salud', 'Trabajo', 'Personal')),
  frecuencia         text not null check (frecuencia in ('una_vez', 'diaria', 'semanal')),
  dias               smallint[] not null default '{}',   -- 0 = domingo … 6 = sábado (para 'semanal')
  fecha              date,                                -- para 'una_vez'
  dificultad         text not null check (dificultad in ('facil', 'media', 'dificil')),
  puntos             int generated always as (
                       case dificultad when 'facil' then 5 when 'media' then 10 else 20 end
                     ) stored,
  duracion_min       int check (duracion_min is null or duracion_min between 1 and 600),
  hora_recordatorio  time,
  creada_en          timestamptz not null default now(),
  actualizada_en     timestamptz not null default now(),
  constraint tarea_una_vez_con_fecha check (frecuencia <> 'una_vez' or fecha is not null),
  constraint tarea_semanal_con_dias  check (frecuencia <> 'semanal' or cardinality(dias) > 0),
  constraint tarea_dias_validos      check (dias <@ array[0,1,2,3,4,5,6]::smallint[])
);
create index if not exists tareas_usuario_idx on public.tareas (usuario_id);

-- Historial de cumplimientos. Se conserva aunque la tarea se edite o elimine.
create table if not exists public.cumplimientos (
  id            bigint generated always as identity primary key,
  usuario_id    uuid not null references public.perfiles (id) on delete cascade,
  tarea_id      bigint references public.tareas (id) on delete set null,
  tarea_nombre  text not null,
  categoria     text not null,
  fecha         date not null,
  puntos        int  not null check (puntos >= 0),
  duracion_min  int,
  creado_en     timestamptz not null default now()
);
-- Una tarea solo puede cumplirse una vez por día (no se repiten puntos)
create unique index if not exists cumplimientos_unico on public.cumplimientos (tarea_id, fecha) where tarea_id is not null;
create index if not exists cumplimientos_usuario_fecha on public.cumplimientos (usuario_id, fecha);

-- ---------------------------------------------------------------------
-- 2. Funciones auxiliares y triggers
-- ---------------------------------------------------------------------

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin' and activo);
$$;

create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'perfiles' then new.actualizado_en := now();
  else new.actualizada_en := now(); end if;
  return new;
end $$;

drop trigger if exists perfiles_tocar on public.perfiles;
create trigger perfiles_tocar before update on public.perfiles
  for each row execute function public.tocar_actualizado();
drop trigger if exists tareas_tocar on public.tareas;
create trigger tareas_tocar before update on public.tareas
  for each row execute function public.tocar_actualizado();

-- Al registrarse un usuario se crea su perfil.
-- El rol NUNCA se toma de los datos que envía el cliente: el primer usuario
-- del sistema queda como admin y los demás como 'usuario'.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from public.perfiles where rol = 'admin') then 'usuario' else 'admin' end
  );
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

-- Un usuario normal no puede cambiarse el rol ni activarse/desactivarse.
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_admin() then
    new.rol := old.rol;
    new.activo := old.activo;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists perfiles_proteger on public.perfiles;
create trigger perfiles_proteger before update on public.perfiles
  for each row execute function public.proteger_perfil();

-- ---------------------------------------------------------------------
-- 3. Seguridad por filas (RLS)
-- ---------------------------------------------------------------------

alter table public.perfiles      enable row level security;
alter table public.tareas        enable row level security;
alter table public.cumplimientos enable row level security;

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());
drop policy if exists perfiles_editar on public.perfiles;
create policy perfiles_editar on public.perfiles for update to authenticated
  using (id = auth.uid() or public.es_admin()) with check (id = auth.uid() or public.es_admin());

drop policy if exists tareas_leer on public.tareas;
create policy tareas_leer on public.tareas for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());
drop policy if exists tareas_crear on public.tareas;
create policy tareas_crear on public.tareas for insert to authenticated
  with check (usuario_id = auth.uid());
drop policy if exists tareas_editar on public.tareas;
create policy tareas_editar on public.tareas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists tareas_eliminar on public.tareas;
create policy tareas_eliminar on public.tareas for delete to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

-- Los cumplimientos solo se escriben mediante las funciones de abajo.
drop policy if exists cumplimientos_leer on public.cumplimientos;
create policy cumplimientos_leer on public.cumplimientos for select to authenticated
  using (usuario_id = auth.uid() or public.es_admin());

-- ---------------------------------------------------------------------
-- 4. API: funciones RPC
-- ---------------------------------------------------------------------

-- Marca una tarea como cumplida. Los puntos los calcula el servidor.
create or replace function public.completar_tarea(p_tarea_id bigint, p_fecha date)
returns public.cumplimientos language plpgsql security definer set search_path = public as $$
declare
  t public.tareas;
  c public.cumplimientos;
begin
  select * into t from public.tareas where id = p_tarea_id and usuario_id = auth.uid();
  if not found then raise exception 'Tarea no encontrada'; end if;
  if p_fecha not between current_date - 1 and current_date + 1 then
    raise exception 'Solo puedes marcar tareas de hoy';
  end if;
  insert into public.cumplimientos (usuario_id, tarea_id, tarea_nombre, categoria, fecha, puntos, duracion_min)
  values (auth.uid(), t.id, t.nombre, t.categoria, p_fecha, t.puntos, t.duracion_min)
  on conflict (tarea_id, fecha) where tarea_id is not null do nothing
  returning * into c;
  if c.id is null then
    select * into c from public.cumplimientos where tarea_id = t.id and fecha = p_fecha;
  end if;
  return c;
end $$;

-- Desmarca una tarea (se retiran sus puntos de ese día).
create or replace function public.desmarcar_tarea(p_tarea_id bigint, p_fecha date)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.cumplimientos
  where tarea_id = p_tarea_id and fecha = p_fecha and usuario_id = auth.uid();
end $$;

-- Admin: registrar un usuario nuevo con correo y contraseña.
create or replace function public.admin_crear_usuario(p_email text, p_password text, p_nombre text, p_rol text default 'usuario')
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  nuevo uuid := gen_random_uuid();
  correo text := lower(trim(p_email));
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede registrar usuarios'; end if;
  if p_rol not in ('admin', 'usuario') then raise exception 'Rol no válido'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if exists (select 1 from auth.users where email = correo) then raise exception 'Ya existe un usuario con ese correo'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', nuevo, 'authenticated', 'authenticated', correo,
          crypt(p_password, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', p_nombre), now(), now(),
          '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), nuevo, nuevo::text,
          jsonb_build_object('sub', nuevo::text, 'email', correo, 'email_verified', true),
          'email', now(), now(), now());

  update public.perfiles set rol = p_rol, nombre = coalesce(nullif(trim(p_nombre), ''), nombre) where id = nuevo;
  return nuevo;
end $$;

-- Admin: actualizar datos de un usuario (y opcionalmente su contraseña).
create or replace function public.admin_actualizar_usuario(p_id uuid, p_nombre text, p_email text, p_rol text, p_activo boolean, p_password text default null)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  correo text := lower(trim(p_email));
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede editar usuarios'; end if;
  if p_id = auth.uid() and (p_rol <> 'admin' or not p_activo) then
    raise exception 'No puedes quitarte el rol de admin ni desactivarte a ti mismo';
  end if;
  if exists (select 1 from auth.users where email = correo and id <> p_id) then
    raise exception 'Ya existe un usuario con ese correo';
  end if;
  update public.perfiles set nombre = p_nombre, email = correo, rol = p_rol, activo = p_activo where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
  update auth.users set email = correo,
         banned_until = case when p_activo then null else 'infinity'::timestamptz end,
         encrypted_password = case when coalesce(p_password, '') <> '' then crypt(p_password, gen_salt('bf')) else encrypted_password end,
         updated_at = now()
  where id = p_id;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', correo)
  where user_id = p_id and provider = 'email';
end $$;

-- Admin: eliminar un usuario y todos sus datos.
create or replace function public.admin_eliminar_usuario(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede eliminar usuarios'; end if;
  if p_id = auth.uid() then raise exception 'No puedes eliminar tu propia cuenta desde el panel'; end if;
  delete from auth.users where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
end $$;

-- Resumen de usuarios para el panel de admin (consultar todos / por id).
create or replace function public.admin_resumen_usuarios(p_id uuid default null)
returns table (id uuid, nombre text, email text, rol text, avatar_url text, activo boolean,
               creado_en timestamptz, puntos bigint, tareas bigint, cumplimientos bigint, ultima_actividad date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede consultar usuarios'; end if;
  return query
    select p.id, p.nombre, p.email, p.rol, p.avatar_url, p.activo, p.creado_en,
           coalesce((select sum(c.puntos) from public.cumplimientos c where c.usuario_id = p.id), 0)::bigint,
           (select count(*) from public.tareas t where t.usuario_id = p.id),
           (select count(*) from public.cumplimientos c where c.usuario_id = p.id),
           (select max(c.fecha) from public.cumplimientos c where c.usuario_id = p.id)
    from public.perfiles p
    where p_id is null or p.id = p_id
    order by p.creado_en;
end $$;

-- Genera 2 semanas de historial de ejemplo para el usuario actual.
-- Útil para la sustentación: muestra rachas, estadísticas y logros.
drop function if exists public.generar_datos_demo();
create or replace function public.generar_datos_demo(p_hoy date default current_date)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  d date;
  t record;
begin
  if uid is null then raise exception 'Debes iniciar sesión'; end if;

  if not exists (select 1 from public.tareas where usuario_id = uid) then
    insert into public.tareas (usuario_id, nombre, categoria, frecuencia, dias, dificultad, duracion_min, hora_recordatorio, creada_en) values
      (uid, 'Levantarse temprano',  'Salud',    'diaria',  '{}',          'facil',   null, '06:00', now() - interval '15 days'),
      (uid, 'Estudiar programación', 'Estudio', 'diaria',  '{}',          'media',   60,   '19:00', now() - interval '15 days'),
      (uid, 'Hacer ejercicio',      'Salud',    'semanal', '{1,3,5}',     'dificil', 45,   '07:00', now() - interval '15 days'),
      (uid, 'Leer 20 minutos',      'Personal', 'diaria',  '{}',          'facil',   20,   '21:30', now() - interval '15 days'),
      (uid, 'Revisar pendientes',   'Trabajo',  'semanal', '{1,2,3,4,5}', 'media',   30,   null,    now() - interval '15 days');
  else
    update public.tareas set creada_en = least(creada_en, now() - interval '15 days') where usuario_id = uid;
  end if;

  for d in select generate_series(p_hoy - 14, p_hoy - 1, interval '1 day')::date loop
    for t in
      select * from public.tareas
      where usuario_id = uid
        and (frecuencia = 'diaria'
             or (frecuencia = 'semanal' and extract(dow from d)::smallint = any (dias))
             or (frecuencia = 'una_vez' and fecha = d))
    loop
      -- ~80 % de cumplimiento, con un "día flojo" hace 6 días (lo salva el comodín)
      if d <> p_hoy - 6 and random() < 0.8 then
        insert into public.cumplimientos (usuario_id, tarea_id, tarea_nombre, categoria, fecha, puntos, duracion_min)
        values (uid, t.id, t.nombre, t.categoria, d, t.puntos, t.duracion_min)
        on conflict do nothing;
      end if;
    end loop;
  end loop;
end $$;

revoke execute on function public.completar_tarea(bigint, date)          from anon;
revoke execute on function public.desmarcar_tarea(bigint, date)          from anon;
revoke execute on function public.admin_crear_usuario(text, text, text, text) from anon;
revoke execute on function public.admin_actualizar_usuario(uuid, text, text, text, boolean, text) from anon;
revoke execute on function public.admin_eliminar_usuario(uuid)           from anon;
revoke execute on function public.admin_resumen_usuarios(uuid)           from anon;
revoke execute on function public.generar_datos_demo(date)               from anon;

-- ---------------------------------------------------------------------
-- 5. Almacenamiento de fotos de perfil (cámara / galería)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_leer on storage.objects;
create policy avatars_leer on storage.objects for select
  using (bucket_id = 'avatars');
drop policy if exists avatars_subir on storage.objects;
create policy avatars_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_actualizar on storage.objects;
create policy avatars_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_borrar on storage.objects;
create policy avatars_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
