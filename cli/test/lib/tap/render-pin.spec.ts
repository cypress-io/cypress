import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import type { ClearResult, PinResult } from '@packages/cypress-instances'
import { renderPinHuman } from '../../../lib/tap/render/pin'

const render = (result: PinResult | ClearResult): string => stripAnsi(renderPinHuman(result))

describe('lib/tap/render/pin', () => {
  it('renders a pin as the reporter row it pinned, under its hook section', () => {
    const output = render({
      pinned: {
        test: 'r3',
        at: { index: 2, total: 2, name: 'after' },
        hookName: 'before each',
        command: { id: '1', name: 'task', message: 'db:seed', state: 'passed', type: 'parent', hookId: 'h2' },
      },
      url: 'http://localhost:8080/login',
    })

    expect(output).toBe([
      '⚲ PINNED - (2/2) after',
      'BEFORE EACH · h2',
      '   1  task  db:seed',
    ].join('\n'))
  })

  it('names the snapshot by index alone when it has no name', () => {
    const output = render({
      pinned: {
        test: 'r3',
        at: { index: 1, total: 3 },
        command: { id: 'e2', name: 'get', message: '#login', event: true },
      },
    })

    expect(output).toContain('⚲ PINNED - (1/3)')
  })

  it('reports a released pin, and a clear that let nothing go', () => {
    expect(render({ cleared: true })).toBe('⚲ PIN CLEARED')
    expect(render({ cleared: false })).toBe('⚲ FAILED TO CLEAR PIN')
  })
})
