import type { TapSpecEntry } from '../commands/specs'
import { color, emptyState, heading, layout } from './format'

// A flat, headed list of runnable specs. The git last-modified time trails each
// path, aligned into a muted column; the machine-facing timestamp stays in --json.
// An empty project keeps the same `SPECS (n)` frame so the shape reads the same
// whether or not any specs exist.
export const renderSpecsHuman = (specs: TapSpecEntry[]): string => {
  if (!specs.length) {
    return layout([[heading('SPECS', 0), `  ${emptyState('[EMPTY PROJECT]')}`]])
  }

  const width = Math.max(...specs.map((spec) => spec.relativePath.length))

  const rows = specs.map((spec) => {
    const modified = spec.lastModified ? `  ${color.muted(spec.lastModified)}` : ''

    return `  ${spec.relativePath.padEnd(width)}${modified}`
  })

  return layout([[heading('SPECS', specs.length), ...rows]])
}
