// Sistema visual de RITMO (Documento Maestro, sección 3)
export const colores = {
  verde: '#72C267',
  verdeOscuro: '#315C35',
  verdeProfundo: '#10251A',
  verdeSuave: '#E3F3DF',
  crema: '#F7F7F5',
  amarillo: '#F4C95D',
  amarilloSuave: '#FDF3D8',
  blanco: '#FFFFFF',
  gris: '#8A8A8A',
  grisClaro: '#E7E7E3',
  texto: '#171717',
  rojo: '#D9534F',
  rojoSuave: '#FBE9E8',
  azul: '#5B8DEF',
};

export const categorias = {
  Estudio: { color: '#5B8DEF', fondo: '#E6EEFD', icono: 'school-outline' },
  Salud: { color: '#E07A5F', fondo: '#FBEAE5', icono: 'heart-outline' },
  Trabajo: { color: '#8E6CCF', fondo: '#EFE9F9', icono: 'briefcase-outline' },
  Personal: { color: '#2A9D8F', fondo: '#E2F3F1', icono: 'leaf-outline' },
} as const;

export const fuentes = {
  regular: 'Manrope_400Regular',
  media: 'Manrope_500Medium',
  semi: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extra: 'Manrope_800ExtraBold',
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radio = { s: 10, m: 16, l: 22, xl: 28, total: 999 };

export const sombra = {
  shadowColor: '#10251A',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};
