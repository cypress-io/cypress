import type { PinnedView } from '@packages/cypress-instances'
import { color } from './format'
import { renderCommandSection } from './reporter'

const PIN_ICON = '⚲'

// A pin reads as its own reporter row: which snapshot of the command is showing,
// then the row itself under its hook section, exactly as `reporter` prints it.
// Shared so `pin` and `status` can't drift.
export const pinnedBlock = (view: PinnedView): string[] => {
  const { index, total, name } = view.at
  const snapshot = `(${index}/${total})${name ? ` ${name}` : ''}`

  return [
    color.alias(`${PIN_ICON} PINNED - ${snapshot}`),
    ...renderCommandSection([view.command], view.hookName),
  ]
}
