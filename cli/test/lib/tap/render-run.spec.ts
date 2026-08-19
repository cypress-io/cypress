import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderRunHuman } from '../../../lib/tap/render/run'
import type { TapRunResult } from '../../../lib/tap/commands/run'

const render = (result: TapRunResult): string => stripAnsi(renderRunHuman(result))

describe('lib/tap/render/run', () => {
  it('renders the launched spec as a title with its testing type and browser', () => {
    const output = render({ spec: 'cypress/e2e/login.cy.ts', testingType: 'e2e', browser: 'Chrome' })

    expect(output).toBe([
      '▶ cypress/e2e/login.cy.ts',
      '',
      '  testing type  e2e',
      '  browser       Chrome',
    ].join('\n'))
  })
})
