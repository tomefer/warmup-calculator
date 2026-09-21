/**
 * Parseo del peso tecleado a mano.
 *
 * Va aparte del componente para poder probarlo sin DOM: es donde estaba el bug
 * que impedía escribir cualquier peso terminado en `.5`, o sea la mitad de los
 * pesos reales de un gimnasio.
 */

/**
 * Dígitos con un único separador decimal, admitiendo estados a medio teclear
 * como `""`, `"7."` o `"7,"`.
 *
 * Es la clave del arreglo: si solo se aceptan números completos, al teclear
 * `"7."` el valor vuelve a `"7"` y el punto desaparece antes de poder escribir
 * el `5`.
 */
export const isPartialWeight = (raw: string): boolean =>
  /^\d*(?:[.,]\d*)?$/.test(raw)

/**
 * Convierte el texto a número, o `null` si todavía no representa uno (campo
 * vacío, o solo el separador).
 *
 * Acepta la coma además del punto: es lo que ofrece el teclado numérico de un
 * móvil en español, y `parseFloat("7,5")` devuelve `7` sin avisar.
 */
export const parseWeight = (raw: string): number | null => {
  const parsed = parseFloat(raw.replace(',', '.'))
  return isNaN(parsed) ? null : parsed
}
