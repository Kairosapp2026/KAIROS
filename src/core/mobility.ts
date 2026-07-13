export const MOBILITY: Record<string, string[]> = {
  hombro: ['90/90 en suelo con respiracion - 2x45"/lado', 'Wall slides - 2x10 lento', 'Cuelgue pasivo suave - 2x20"'],
  muneca: ['Circulos y bombeo - 2x15', 'Estiramiento flexores/extensores en cuadrupedia - 2x30"', 'Extension con banda - 2x15'],
  lumbar: ['Gato-camello - 2x10', 'Child pose con alcance lateral - 2x40"/lado', 'Rodillas al pecho + respiracion diafragmatica - 2 min'],
  rodilla: ['Sentadilla espanola isometrica - 3x30"', 'Estiramiento de cuadriceps pie elevado - 2x40"/lado', 'Terminal knee extension con banda - 2x15'],
  cadera: ['90/90 transiciones - 2x8/lado', 'Psoas en zancada con brazo arriba - 2x40"/lado', 'Apertura en cuclillas - 2x45"'],
  tobillo: ['Dorsiflexion rodilla-a-pared - 2x12/lado', 'Soleo con rodilla flexionada - 2x40"/lado', 'Elevacion de talon excentrica - 2x12'],
};

export const ZONES = [
  { id: 'hombro', name: 'Hombro' },
  { id: 'muneca', name: 'Muneca' },
  { id: 'lumbar', name: 'Lumbar' },
  { id: 'rodilla', name: 'Rodilla' },
  { id: 'cadera', name: 'Cadera' },
  { id: 'tobillo', name: 'Tobillo' },
];

export const PAIN_TYPES = [
  { id: 'calentar', name: 'Solo al empezar / calentar', desc: 'Desaparece al entrar en calor' },
  { id: 'final', name: 'En el rango final', desc: 'Molesta al llegar al fondo del movimiento' },
  { id: 'carga', name: 'Con carga', desc: 'Molesta con peso o impacto' },
] as const;
