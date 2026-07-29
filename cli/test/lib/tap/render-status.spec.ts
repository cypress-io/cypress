import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderStatusHuman } from '../../../lib/tap/render/status'
import type { TapStatus } from '../../../lib/tap/types'

const render = (status: TapStatus): string => stripAnsi(renderStatusHuman(status))

describe('lib/tap/render/status', () => {
  it('renders a mid-run status: phase, spec, fields, counts, and the pin', () => {
    const output = render({
      status: 'running',
      pid: 4242,
      projectRoot: '/projects/app',
      testingType: 'e2e',
      browserAttached: true,
      totalSpecs: 3,
      spec: 'cypress/e2e/login.cy.ts',
      totalTests: 5,
      results: { passed: 1, failed: 1, pending: 2, skipped: 1 },
      pinned: { command: 'c4', at: { index: 8, name: 'loads' } },
    })

    expect(output).toBe([
      '● running  cypress/e2e/login.cy.ts',
      '',
      '  pid           4242',
      '  project       /projects/app',
      '  testing type  e2e',
      '  specs         3',
      '  tests         5',
      '',
      '  ✓ 1  ✖ 1  ○ 2  - 1',
      '',
      '  pinned  c4  test 8 "loads"',
    ].join('\n'))
  })

  it('renders the minimal not-connected phase as a single line', () => {
    expect(render({ status: 'not connected' })).toBe('● not connected')
  })
})
