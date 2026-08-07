import chalk from 'chalk'
import { MAX_DERIVED_SELECTORS } from '@packages/cypress-instances'

import type { FrameAmbiguousResult } from '../aut/single-match'
import { color, columns, layout, quoted } from './format'

// dom, aria, and inspect all answer an ambiguous selector the same way, so they
// render it the same way: what went wrong, then the matches. Either column
// re-runs the read — `--at <index>`, or the unique selector.
export const renderAmbiguousHuman = (result: FrameAmbiguousResult): string => {
  const headline = color.warn(`⚠ selector ${chalk.bold(quoted(result.selector))} matched ${chalk.bold(result.count)} elements but must be unique`)
  const note = color.warn(`provide ${chalk.bold('--at')} with an index to select an element from the list or update the selector.`)

  // Number no further than the instance derives selectors for: `*` on a real
  // page matches thousands, and every row past the cap could only ever be a
  // bare index. --at still reads any of them, so say what the list leaves out.
  const numbered = Math.min(result.count, MAX_DERIVED_SELECTORS)

  // A match no unique selector could be derived for still keeps its row, since
  // --at reads it either way.
  const derived = new Map(result.selectors.flatMap(({ index, selector }) => (selector ? [[index, quoted(selector)] as const] : [])))
  const rows = Array.from({ length: numbered }, (_, index) => [String(index), derived.get(index) ?? '-'])
  const colorize = (cells: string[], index: number) => (derived.has(index) ? cells : [cells[0], color.muted(cells[1])])

  const table = [headline, note, ...columns(['index', 'selector'], rows, colorize)]

  // Only a null the instance reported says a match has no derivable selector. A
  // list that stops short — the lookup failed, or never reached the app under
  // test — leaves its rows as dashes with nothing known about why, so there is
  // nothing to send the reader back to their selector config over.
  const underivable = result.selectors.some(({ selector }) => !selector)

  const notes = [
    ...(numbered === result.count ? [] : [`showing the first ${numbered} of ${result.count} matches — --at takes any index up to ${result.count - 1}.`]),
    ...(underivable ? ['- means no unique selector could be derived for that match — you may need to adjust your Cypress.ElementSelector config, or the element may be one no standard CSS selector can identify.'] : []),
  ].map((line) => color.muted(line))

  return layout(notes.length ? [table, notes] : [table])
}
