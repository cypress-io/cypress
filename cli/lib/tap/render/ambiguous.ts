import chalk from 'chalk'

import type { FrameAmbiguousResult } from '../aut/single-match'
import { color, layout, quoted } from './format'

// dom, aria, and inspect all answer an ambiguous selector the same way, so they
// render it the same way: what went wrong, then the way through.
export const renderAmbiguousHuman = (result: FrameAmbiguousResult): string => {
  const headline = color.warn(`⚠ selector ${chalk.bold(quoted(result.selector))} matched ${chalk.bold(result.count)} elements but must be unique`)

  return layout([[headline, color.muted(`pass --at <index> to read one of them (0-${result.count - 1})`)]])
}
