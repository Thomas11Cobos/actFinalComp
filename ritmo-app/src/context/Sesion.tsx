import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/lib/tipos';

interface SesionCtx {
  cargando: boolean;
  sesion: Session | null;
  perfil: Perfil | null;
  esAdmin: boolean;
  refrescarPerfil: () => Promise<void>;
  setPerfil: (p: Perfil) => void;
}

const Ctx = createContext<SesionCtx | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setPerfil(null);
      return;
    }
    try {
      const p = await api.obtenerPerfil(s.user.id);
      if (!p.activo) {
        await api.cerrarSesion();
        setPerfil(null);
        return;
      }
      setPerfil(p);
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSesion(data.session);
      await cargarPerfil(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT' || evento === 'USER_UPDATED') {
        // se difiere para no bloquear el callback de Supabase
        setTimeout(() => cargarPerfil(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [cargarPerfil]);

  const refrescarPerfil = useCallback(() => cargarPerfil(sesion), [cargarPerfil, sesion]);

  return (
    <Ctx.Provider value={{ cargando, sesion, perfil, esAdmin: perfil?.rol === 'admin', refrescarPerfil, setPerfil }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSesion() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSesion fuera de SesionProvider');
  return c;
}
