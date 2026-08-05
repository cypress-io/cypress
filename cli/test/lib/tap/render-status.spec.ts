import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderStatusHuman } from '../../../lib/tap/render/status'
import type { TapStatus } from '../../../lib/tap/types'

// The start time renders against the terminal's own clock, so pin the zone the
// expected reading is written in.
process.env.TZ = 'UTC'

const render = (status: TapStatus): string => stripAnsi(renderStatusHuman(status))

describe('lib/tap/render/status', () => {
  it('renders a mid-run status: the instance row, the spec led by its phase icon and trailed by the run start, counts, and the pin', () => {
    const output = render({
      status: 'running',
      pid: 4242,
      projectRoot: '/projects/app',
      testingType: 'e2e',
      browserAttached: true,
      browserName: 'Chrome',
      totalSpecs: 3,
      spec: 'cypress/e2e/login.cy.ts',
      startedAt: '2026-07-29T10:15:00.000Z',
      totalTests: 5,
      results: { passed: 1, failed: 1, pending: 2, skipped: 1 },
      pinned: {
        test: 'r3',
        at: { index: 2, total: 2, name: 'after' },
        hookName: 'before each',
        command: { id: '1', name: 'task', message: 'db:seed', hookId: 'h2' },
      },
    })

    expect(output).toBe([
      'PID   PROJECT        TYPE  BROWSER',
      '4242  /projects/app  e2e   Chrome',
      '',
      '● cypress/e2e/login.cy.ts  (started at 10:15:00 AM)',
      '✓ 1  ✖ 1  ○ 2  - 1',
      '',
      '⚲ PINNED - (2/2) after',
      'BEFORE EACH · h2',
      '   1  task  db:seed',
    ].join('\n'))
  })

  it('renders a spec whose run has not started as the spec alone, with no start time to trail it', () => {
    const output = render({
      status: 'loading',
      pid: 4242,
      projectRoot: '/projects/app',
      testingType: 'e2e',
      browserAttached: true,
      browserName: 'Chrome',
      totalSpecs: 3,
      spec: 'cypress/e2e/login.cy.ts',
      startedAt: null,
    })

    expect(output).toBe([
      'PID   PROJECT        TYPE  BROWSER',
      '4242  /projects/app  e2e   Chrome',
      '',
      '● cypress/e2e/login.cy.ts',
    ].join('\n'))
  })

  it('renders a pre-spec phase as the instance row plus the phase on its own', () => {
    const output = render({
      status: 'browser not selected',
      pid: 111,
      projectRoot: '/projects/app',
      testingType: 'e2e',
      browserAttached: false,
      browserName: null,
    })

    expect(output).toBe([
      'PID  PROJECT        TYPE  BROWSER',
      '111  /projects/app  e2e   —',
      '',
      '● browser not selected',
    ].join('\n'))
  })

  it('renders the minimal not-connected phase as a single line', () => {
    expect(render({ status: 'not connected' })).toBe('● not connected')
  })
})
