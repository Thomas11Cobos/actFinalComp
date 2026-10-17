# RITMO · Tu constancia también se mide

Aplicación móvil de tareas y hábitos diarios con puntos, rachas, niveles, logros y estadísticas.
Proyecto del curso **Computación Móvil** (UNIMINUTO).

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| App móvil | React Native 0.86 + Expo SDK 57 + TypeScript |
| Navegación | Expo Router (rutas por archivos) |
| API | Supabase (PostgREST: API REST generada sobre PostgreSQL + funciones RPC) |
| Autenticación | Supabase Auth (correo y contraseña) |
| Base de datos | PostgreSQL 17 con seguridad por filas (RLS) |
| Archivos | Supabase Storage (fotos de perfil) |
| Funciones móviles | Notificaciones locales (expo-notifications), cámara/galería (expo-image-picker), vibración háptica (expo-haptics) |

## Estructura

```
src/
  app/                 Pantallas (cada archivo es una ruta)
    (tabs)/            Inicio, Tareas, Estadísticas, Usuarios (admin), Perfil
    tarea/             Crear y detalle/editar/eliminar tarea
    admin/             Registrar y detalle/editar/eliminar usuario
    bienvenida, login, registro, onboarding, racha, logros, recordatorios, editar-perfil, ayuda
  components/          Sistema de diseño (botones, campos, tarjetas, anillo, gráfica, modal de recompensa)
  context/             Estado global: sesión y datos
  lib/
    api.ts             Todas las llamadas a la API
    progreso.ts        Motor de puntos, bonos, rachas, comodín, niveles, logros y estadísticas
    notificaciones.ts  Recordatorios locales
supabase/ritmo_base_de_datos.sql   Tablas, RLS, funciones RPC y almacenamiento
tests/                             Pruebas de la API (33) y del motor de progreso (23)
```

## Funcionalidades (requisito mínimo: 15)

**Módulo Usuarios** (perfiles: administrador y usuario)
1. Iniciar sesión
2. Cerrar sesión
3. Autorregistro
4. Registrar usuarios (admin)
5. Consultar todos los usuarios (admin)
6. Consultar usuario por id (admin)
7. Actualizar usuario (admin; el usuario también edita su propia cuenta)
8. Eliminar usuario (admin)

**Módulo Tareas**
9. Registrar tarea
10. Consultar todas las tareas (búsqueda y filtro por categoría)
11. Consultar tarea por id (detalle con historial)
12. Actualizar tarea (sin borrar el historial)
13. Eliminar tarea (los puntos ganados se conservan)

**Funcionalidades móviles**
14. Recordatorios con notificaciones locales (por tarea, resumen diario y aviso de racha)
15. Cámara/galería para la foto de perfil (subida a Supabase Storage)
16. Vibración háptica al completar tareas

**Extras de RITMO**: puntos por dificultad, bonificaciones, rachas con calendario, comodín mensual, 5 niveles, 8 logros, estadísticas por periodo, resumen semanal, onboarding y datos de demostración.

## Cómo ejecutarlo

1. Crea un proyecto en [supabase.com](https://supabase.com) y ejecuta `supabase/ritmo_base_de_datos.sql` en **SQL Editor**.
2. En **Authentication → Sign In / Providers → Email**, desactiva **Confirm email**.
3. Copia `.env.example` como `.env` y pon la URL y la clave pública de tu proyecto.
4. `npm install` y luego `npx expo start`. Escanea el QR con **Expo Go**.

El primer usuario que se registra queda como **administrador**.

## Pruebas

```bash
node tests/api.test.mjs        # requiere Supabase local (supabase start)
npx tsx tests/progreso.test.ts
```
