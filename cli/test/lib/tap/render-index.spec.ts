import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderingFor } from '../../../lib/tap/render'

describe('lib/tap/render', () => {
  const renderCommand = (result: unknown, options: Record<string, string>): string | undefined => {
    const rendered = renderingFor('command')!.renderHuman(result, options)

    return rendered === undefined ? undefined : stripAnsi(rendered)
  }

  it('renders the row, its snapshots, and its console properties as one view', () => {
    const result = {
      id: '3',
      name: 'get',
      message: '#user',
      state: 'passed',
      type: 'parent',
      hook: { hookId: 'r2', hookName: 'test body' },
      snapshots: [{ index: 1, name: 'before' }],
      consoleProps: { name: 'get', type: 'command', props: { Selector: '#user' } },
    }

    expect(renderCommand(result, {})).to.eq([
      'TEST BODY · r2',
      '✓  3  get  #user  passed',
      '',
      'SNAPSHOTS (1)',
      '  #  NAME    TIME',
      '  1  before  —',
      '',
      'CONSOLE PROPS',
      '  Selector  #user',
    ].join('\n'))
  })

  // --full-report is about what the instance returns, not about how it reads:
  // the view still renders, and a value too long for its row keeps every
  // character it was asked for instead of being clamped back down.
  it('renders --full-report through the view, keeping the long values whole', () => {
    const result = {
      id: '3',
      name: 'request',
      hook: { hookId: 'r2', hookName: 'test body' },
      snapshots: [],
      consoleProps: { name: 'request', type: 'command', props: { body: 'x'.repeat(5_000) } },
    }

    const rendered = renderCommand(result, { 'full-report': 'true' })

    expect(rendered).to.include('CONSOLE PROPS')
    expect(rendered).not.to.include('…')
    expect(rendered!.replace(/[^x]/g, '')).to.have.length(5_000)
  })

  it('has no rendering for a command that prints JSON', () => {
    expect(renderingFor('run-state')).to.eq(undefined)
  })

  it('has no rendering for a schema command without a registered view', () => {
    expect(renderingFor('health')).to.eq(undefined)
  })
})
