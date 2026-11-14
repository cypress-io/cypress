import { decode, encode } from 'source-map-js/lib/base64-vlq'
import type { Edit } from '../generator/escape-non-latin1'

type ColumnEdit = { column: number, delta: number }

function editsByLine (script: string, edits: Edit[]) {
  const byLine = new Map<number, ColumnEdit[]>()
  let line = 0
  let lineStart = 0

  for (const { index, delta } of edits) {
    for (let newline = script.indexOf('\n', lineStart); newline !== -1 && newline < index; newline = script.indexOf('\n', lineStart)) {
      line++
      lineStart = newline + 1
    }

    const lineEdits = byLine.get(line) ?? []

    lineEdits.push({ column: index - lineStart, delta })
    byLine.set(line, lineEdits)
  }

  return byLine
}

/**
 * Moves the generated columns of `sourceMap`, a map of `script`, to account
 * for `edits` made to `script`. Only the lines that were edited are decoded.
 */
export function shiftGeneratedColumns (sourceMap: string, script: string, edits: Edit[]): string {
  if (edits.length === 0) return sourceMap

  const map = JSON.parse(sourceMap)
  const lines: string[] = map.mappings.split(';')

  for (const [line, lineEdits] of editsByLine(script, edits)) {
    if (!lines[line]) continue

    let column = 0
    let previousShifted = 0

    lines[line] = lines[line].split(',').map((segment) => {
      // The first field of a segment is its generated column, relative to the previous segment on the line
      const decoded: { value: number, rest: number } = { value: 0, rest: 0 }

      decode(segment, 0, decoded)
      column += decoded.value

      const shifted = column + lineEdits.reduce((sum, edit) => edit.column < column ? sum + edit.delta : sum, 0)
      const encoded = `${encode(shifted - previousShifted)}${segment.slice(decoded.rest)}`

      previousShifted = shifted

      return encoded
    }).join(',')
  }

  map.mappings = lines.join(';')

  return JSON.stringify(map)
}
