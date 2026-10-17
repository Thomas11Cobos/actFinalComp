// Ayuda y soporte
import { StyleSheet, Text, View } from 'react-native';
import { Encabezado, Pantalla, Tarjeta } from '@/components/ui';
import { BONO_DIA_COMPLETO, BONO_SIETE_DIAS, NIVELES } from '@/lib/progreso';
import { colores, fuentes } from '@/lib/tema';

const PREGUNTAS: [string, string][] = [
  ['¿Cómo gano puntos?', 'Cada tarea completada suma según su dificultad: Fácil +5, Media +10 y Difícil +20. Una tarea solo suma una vez por día, aunque la marques y desmarques.'],
  ['¿Hay bonificaciones?', `Completar todas tus tareas del día suma +${BONO_DIA_COMPLETO}. Cada vez que tu racha llega a 7, 14, 21… días ganas +${BONO_SIETE_DIAS}.`],
  ['¿Cómo funciona la racha?', 'Un día cuenta cuando completas al menos tu meta diaria (por ejemplo, 50 % de tus tareas programadas). Los días sin tareas programadas no la rompen.'],
  ['¿Qué es el comodín?', 'Una vez al mes, si un día no alcanzas tu meta, el comodín protege tu racha automáticamente. La constancia importa más que la perfección.'],
  ['¿Si edito o elimino una tarea pierdo mis puntos?', 'No. Tu historial de cumplimientos se conserva siempre.'],
  ['Niveles', NIVELES.map((n) => `${n.numero}. ${n.nombre}: ${n.max === null ? `${n.min}+` : `${n.min}–${n.max}`} pts`).join('\n')],
];

export default function Ayuda() {
  return (
    <Pantalla>
      <Encabezado titulo="Ayuda" />
      {PREGUNTAS.map(([p, r]) => (
        <Tarjeta key={p} style={{ marginBottom: 12 }}>
          <Text style={s.p}>{p}</Text>
          <Text style={s.r}>{r}</Text>
        </Tarjeta>
      ))}
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Text style={s.r}>¿Necesitas más ayuda? Escríbenos a soporte@ritmo.app</Text>
      </View>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  p: { fontFamily: fuentes.bold, fontSize: 15, color: colores.texto, marginBottom: 6 },
  r: { fontFamily: fuentes.regular, fontSize: 14, color: '#55554F', lineHeight: 20 },
});
