export const t = {
  appName: 'Warmup Calculator',
  tabs: {
    squat: 'Sentadilla',
    press: 'Presses',
    deadlift: 'Peso muerto',
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
  press: {
    alternativeButton: 'Si has hecho press antes, dale aquí',
    alternativeLabel: 'Introduce el peso del press anterior:',
  },
  deadlift: {
    alternativeButton: 'Si NO has hecho sentadilla, dale aquí',
  },
} as const
