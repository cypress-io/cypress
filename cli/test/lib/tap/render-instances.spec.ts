import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderInstancesHuman } from '../../../lib/tap/render/instances'
import type { TapInstanceSummary } from '../../../lib/tap/commands/instances'

const render = (instances: TapInstanceSummary[]): string => stripAnsi(renderInstancesHuman(instances))

describe('lib/tap/render/instances', () => {
  it('renders a padded table; missing testing type and detached browser show a dash', () => {
    const output = render([
      { pid: 111, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: true, browserName: 'Chrome' },
      { pid: 222, projectRoot: '/projects/other', testingType: null, browserAttached: false, browserName: null },
    ])

    expect(output).toBe([
      'INSTANCES (2)',
      '  PID  PROJECT          TYPE  BROWSER',
      '  111  /projects/app    e2e   Chrome',
      '  222  /projects/other  —     —',
    ].join('\n'))
  })
})
