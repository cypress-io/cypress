import chalk from 'chalk'

import type { FrameAmbiguousResult } from '../aut/single-match'
import { color, columns, layout, quoted } from './format'

// dom, aria, and inspect all answer an ambiguous selector the same way, so they
// render it the same way: what went wrong, then the matches. Either column
// re-runs the read — `--at <index>`, or the unique selector.
export const renderAmbiguousHuman = (result: FrameAmbiguousResult): string => {
  const headline = color.warn(`⚠ selector ${chalk.bold(quoted(result.selector))} matched ${chalk.bold(result.count)} elements but must be unique`)

  // With no selector derived for any match, --at is the only way through.
  if (!result.selectors.length) {
    return layout([[headline, color.muted(`pass --at <index> to read one of them (0-${result.count - 1})`)]])
  }

  const rows = result.selectors.map(({ index, selector }) => [String(index), quoted(selector)])
  const note = color.warn(`provide ${chalk.bold('--at')} with an index to select an element from the list or update the selector.`)

  return layout([[headline, note, ...columns(['index', 'selector'], rows)]])
}
