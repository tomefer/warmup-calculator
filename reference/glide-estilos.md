# Estilos copiados de la app original

Todo lo de aquí sale de los estilos computados de
`https://warmup-calculator.glide.page` (21/09/2026), no de mirar una captura.
Sirve de referencia para cuando haya que retocar el tema.

## Color

| Uso | Valor | Dónde sale |
|---|---|---|
| Teal de marca | `#01847F` | `meta[name=theme-color]`, barra superior, botones |
| Fondo de página | `#FFFFFF` | `html` |
| Texto principal | `rgba(0,0,0,0.95)` | títulos, repeticiones |
| Texto secundario | `rgba(51,51,51,0.7)` | «Series de calentamiento:», pesos, notas |
| Fondo de campo | `rgba(51,51,51,0.08)` | input de peso, sin borde y sin redondeo |
| Pestaña activa | `rgba(255,255,255,0.1)`, radio 8 | píldora sobre el teal |
| Pestaña inactiva | `rgba(255,255,255,0.8)` | texto |
| Filo bajo la barra | `rgba(255,255,255,0.05) 0 1px 0` | `box-shadow` |

La app original es **solo clara**: no trae modo oscuro. El nuestro es añadido
nuestro y mantiene el mismo teal como acento.

## Tipografía

`Inter`, con la pila de sistema por detrás. Tamaños y grosores medidos:

- Nombre de la app en la barra: 16 / 600
- Pestañas: 14 / 500
- Título de pantalla: 21 / 600
- Etiqueta de campo: 18 / 600
- Botón de acento: 14 / 600, padding `8px 16px`, radio 8
- Pesos y repeticiones: 14 / 400

## Medidas

- Barra superior: 56 px de alto
- Icono de portada: 120 × 120, radio 12, montado sobre el borde de la franja teal

## Imágenes

Dos marcas distintas, las dos de 500–1000 px:

- **Logo teal con la silueta blanca** — es el icono de la app: favicon,
  `apple-touch-icon`, iconos PWA y el logo de la barra superior. Guardado en
  `public/glide-logo.png` y redimensionado a los tamaños de `public/`.
- **Cuadrado naranja con la silueta negra** — es la portada de cada pestaña.
  Ya estaba en el repo como `public/gym-logo.png` (mismo md5 que el que sirve
  Glide).

## Iconos de las pestañas

Glide los sirve como sprites SVG en `/icons/<hash>-1.svg#Bold`, de 24×24. Los
originales están en `public/icons/` y los trazados, ya como componentes React
con `fill="currentColor"`, en `src/components/ExerciseIcons.tsx`:

| Pestaña | Icono | Hash original |
|---|---|---|
| Sentadilla | rack con barra | `19df5215a6b82d064fd102cb78c86793-1` |
| Presses | figura empujando la barra | `e9130490ecbdd8fef3592e53ee834af5-1` |
| Peso Muerto | barra con discos | `36054a607bb5ea1544a6093740b94ca5-1` |

## Lo que no se ha tocado

El aspecto es un clon, pero los **números y el formato siguen siendo los
nuestros**: Glide escribe `35,00` y nosotros `35 kg`, y la nota al pie
`*Si no es el primer ejercicio, hacer sólo 1 serie` sigue sin existir en
nuestro modelo de datos. Esas diferencias son las que llevan `discrepancies.md`
y `todo.md`, y no entran aquí.
