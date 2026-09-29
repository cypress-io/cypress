import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderRunHuman } from '../../../lib/tap/render/run'
import type { TapRunResult } from '../../../lib/tap/commands/run'

const render = (result: TapRunResult): string => stripAnsi(renderRunHuman(result))

describe('lib/tap/render/run', () => {
  it('acknowledges the requested spec as running and points at tap status', () => {
    const output = render({ spec: 'cypress/e2e/login.cy.ts', status: 'running' })

    expect(output).toBe([
      '● cypress/e2e/login.cy.ts is running',
      '',
      'use tap status to check progress',
    ].join('\n'))
  })
})
