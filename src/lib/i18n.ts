export const t = {
  appName: 'Warmup Calculator',
  tabs: {
    squat: 'Sentadilla',
    press: 'Presses',
    deadlift: 'Peso Muerto',
  },
  // Títulos de cada pantalla, con las siglas que usa la app original.
  pageTitles: {
    squat: 'Sentadilla (SQ)',
    press: 'Presses (P,BP)',
    deadlift: 'Peso Muerto (DL)',
  },
  input: {
    label: 'Introduce el peso de la serie efectiva:',
    placeholder: 'kg',
  },
  warmup: {
    sectionTitle: 'Series de calentamiento:',
    rdlEmptyBar: 'RDL con barra vacía',
    tooLight: '¡Demasiado poco peso!',
    outOfRange: 'Peso fuera de rango (máx. 180 kg)',
  },
  // En Glide el modo alternativo es una frase en negrita y debajo un botón
  // teal que siempre pone «Dale aquí».
  altButton: 'Dale aquí',
  press: {
    alternativePrompt: 'Si has hecho justo antes banca o press:',
    alternativeButton: 'Si has hecho press antes, dale aquí',
    alternativeLabel: 'Introduce el peso del press anterior:',
  },
  deadlift: {
    alternativePrompt: 'Si NO has hecho antes sentadillas:',
    alternativeButton: 'Si NO has hecho sentadilla, dale aquí',
  },
} as const
