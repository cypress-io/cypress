import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderInstancesHuman } from '../../../lib/tap/render/instances'
import type { TapInstanceSummary } from '../../../lib/tap/commands/instances'

const render = (instances: TapInstanceSummary[]): string => stripAnsi(renderInstancesHuman(instances))

describe('lib/tap/render/instances', () => {
  it('renders a padded table; missing testing type and detached browser show a dash', () => {
    const output = render([
      { pid: 111, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: true, browserName: 'Chrome', browserSupported: true },
      { pid: 222, projectRoot: '/projects/other', testingType: null, browserAttached: false, browserName: null, browserSupported: true },
    ])

    expect(output).toBe([
      'INSTANCES (2)',
      '  PID  PROJECT          TYPE  BROWSER',
      '  111  /projects/app    e2e   Chrome',
      '  222  /projects/other  —     —',
    ].join('\n'))
  })

  // An attached browser whose page will not answer is the state every other
  // command fails in, so the row has to say so rather than read as healthy.
  it('marks an attached browser whose renderer is not answering', () => {
    const output = render([
      { pid: 111, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: true, browserName: 'Chrome', browserSupported: true, rendererResponsive: false },
      { pid: 222, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: true, browserName: 'Chrome', browserSupported: true, rendererResponsive: true },
    ])

    expect(output).toBe([
      'INSTANCES (2)',
      '  PID  PROJECT        TYPE  BROWSER',
      '  111  /projects/app  e2e   Chrome (not responding)',
      '  222  /projects/app  e2e   Chrome',
    ].join('\n'))
  })

  // Every way an open browser can be undrivable reads differently from a healthy
  // one, and from each other, so the row says which.
  it('marks a browser tap cannot drive, and one it has not attached to yet', () => {
    const output = render([
      { pid: 111, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: false, browserName: 'Firefox', browserSupported: false },
      { pid: 222, projectRoot: '/projects/app', testingType: 'e2e', browserAttached: false, browserName: 'Chrome', browserSupported: true },
    ])

    expect(output).toBe([
      'INSTANCES (2)',
      '  PID  PROJECT        TYPE  BROWSER',
      '  111  /projects/app  e2e   Firefox (unsupported)',
      '  222  /projects/app  e2e   Chrome (not attached)',
    ].join('\n'))
  })
})
