import { decode, encode } from '@jridgewell/sourcemap-codec'
import type { SourceMapLine } from '@jridgewell/sourcemap-codec'
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
function shiftLine (mappings: string, lineEdits: ColumnEdit[]): string {
  // Decoding and encoding a line on its own keeps the other fields' deltas, which both start from zero
  const lines: SourceMapLine[] = [[]]
  let next = 0
  let offset = 0
  let lineStart = 0

  for (const segment of decode(mappings)[0] ?? []) {
    for (; next < lineEdits.length && lineEdits[next].column < segment[0]; next++) {
      const edit = lineEdits[next]

      if (edit.lineBreak) {
        lines.push([])
        lineStart = edit.column + offset + 1
      }

      offset += edit.delta
    }

    segment[0] += offset - lineStart
    lines[lines.length - 1].push(segment)
  }

  for (; next < lineEdits.length; next++) {
    if (lineEdits[next].lineBreak) lines.push([])
  }

  return encode(lines)
}

/**
 * Updates `sourceMap`, a map of `script`, for the `edits` made to `script`.
 * Only the lines that were edited are decoded.
 */
export function shiftGeneratedColumns (sourceMap: string, script: string, edits: Edit[]): string {
  if (edits.length === 0) return sourceMap

  const map = JSON.parse(sourceMap)
  const byLine = editsByLine(script, edits)

  map.mappings = map.mappings.split(';').map((mappings: string, line: number) => {
    const lineEdits = byLine.get(line)

    return lineEdits ? shiftLine(mappings, lineEdits) : mappings
  }).join(';')

  return JSON.stringify(map)
}
