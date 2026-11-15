import { decode, encode } from 'source-map-js/lib/base64-vlq'
import type { Edit } from '../generator/escape-non-latin1'

type ColumnEdit = { column: number, delta: number, lineBreak?: true }

function editsByLine (script: string, edits: Edit[]) {
  const byLine = new Map<number, ColumnEdit[]>()
  let line = 0
  let lineStart = 0

  for (const { index, delta, lineBreak } of edits) {
    for (let newline = script.indexOf('\n', lineStart); newline !== -1 && newline < index; newline = script.indexOf('\n', lineStart)) {
      line++
      lineStart = newline + 1
    }

    const lineEdits = byLine.get(line) ?? []

    lineEdits.push({ column: index - lineStart, delta, lineBreak })
    byLine.set(line, lineEdits)
  }

  return byLine
}

/**
 * Splits one line of mappings at the line breaks in `lineEdits` and moves each
 * segment's generated column by the edits before it.
 */
function shiftLine (mappings: string, lineEdits: ColumnEdit[]): string[] {
  const shift = (column: number) => column + lineEdits.reduce((sum, edit) => edit.column < column ? sum + edit.delta : sum, 0)
  const breaks = lineEdits.filter((edit) => edit.lineBreak).map((edit) => edit.column)
  const lines: string[][] = [[]]
  let column = 0
  let previousShifted = 0

  for (const segment of mappings ? mappings.split(',') : []) {
    // The first field of a segment is its generated column, relative to the previous segment on the line
    const decoded: { value: number, rest: number } = { value: 0, rest: 0 }

    decode(segment, 0, decoded)
    column += decoded.value

    const lineIndex = breaks.filter((breakColumn) => breakColumn < column).length
    const lineStart = lineIndex === 0 ? 0 : shift(breaks[lineIndex - 1]) + 1
    const shifted = shift(column) - lineStart

    while (lines.length <= lineIndex) {
      lines.push([])
      previousShifted = 0
    }

    lines[lineIndex].push(`${encode(shifted - previousShifted)}${segment.slice(decoded.rest)}`)
    previousShifted = shifted
  }

  while (lines.length <= breaks.length) lines.push([])

  return lines.map((segments) => segments.join(','))
}

/**
 * Updates `sourceMap`, a map of `script`, for the `edits` made to `script`.
 * Only the lines that were edited are decoded.
 */
export function shiftGeneratedColumns (sourceMap: string, script: string, edits: Edit[]): string {
  if (edits.length === 0) return sourceMap

  const map = JSON.parse(sourceMap)
  const byLine = editsByLine(script, edits)

  map.mappings = map.mappings.split(';').flatMap((mappings: string, line: number) => {
    const lineEdits = byLine.get(line)

    return lineEdits ? shiftLine(mappings, lineEdits) : [mappings]
  }).join(';')

  return JSON.stringify(map)
}
