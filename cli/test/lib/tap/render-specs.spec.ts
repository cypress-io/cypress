import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderSpecsHuman } from '../../../lib/tap/render/specs'
import type { TapSpecEntry } from '../../../lib/tap/commands/specs'

const render = (specs: TapSpecEntry[]): string => stripAnsi(renderSpecsHuman(specs))

describe('lib/tap/render/specs', () => {
  it('lists specs with git times aligned into a column, and no time when absent', () => {
    const output = render([
      { relativePath: 'cypress/e2e/a.cy.ts', lastModified: '2 hours ago', lastModifiedTimestamp: '2026-07-24 09:00:00 -0500' },
      { relativePath: 'cypress/e2e/longer-name.cy.ts' },
    ])

    expect(output).toBe([
      'SPECS (2)',
      '  cypress/e2e/a.cy.ts            2 hours ago',
      '  cypress/e2e/longer-name.cy.ts',
    ].join('\n'))
  })

  it('keeps the SPECS frame with an empty-project placeholder when there are no specs', () => {
    expect(render([])).toBe([
      'SPECS (0)',
      '  [EMPTY PROJECT]',
    ].join('\n'))
  })
})
