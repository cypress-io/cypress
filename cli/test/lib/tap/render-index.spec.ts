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

  it('has no rendering for a command that prints JSON', () => {
    expect(renderingFor('run-state')).to.eq(undefined)
  })

  it('has no rendering for a schema command without a registered view', () => {
    expect(renderingFor('health')).to.eq(undefined)
  })
})
