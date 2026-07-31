import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderingFor } from '../../../lib/tap/render'

// The options a command was invoked with pick its rendering, since two of its
// result shapes (a log entry and a console-props payload) can carry the same keys.
describe('lib/tap/render', () => {
  const renderCommand = (result: unknown, options: Record<string, string>): string | undefined => {
    const rendered = renderingFor('command')!.renderHuman(result, options)

    return rendered === undefined ? undefined : stripAnsi(rendered)
  }

  it('renders a log entry when --props was not passed', () => {
    expect(renderCommand({ id: '3', name: 'get', message: '#user', state: 'passed', type: 'parent' }, {}))
    .to.eq('✓  3  get  #user  passed')
  })

  it('renders console properties for --props', () => {
    expect(renderCommand({ name: 'get', type: 'command', props: { Selector: '#user' } }, { props: 'true' }))
    .to.eq('CONSOLE PROPS · get\n  Selector  #user')
  })

  // A payload asked for in full is one to pipe into a tool, so it prints as the
  // JSON it is rather than through a view.
  it('declines the rendering for --full-report, deferring to the raw JSON', () => {
    expect(renderCommand({ name: 'request', type: 'command', props: { body: 'a'.repeat(50_000) } }, { 'props': 'true', 'full-report': 'true' }))
    .to.eq(undefined)
  })

  it('has no rendering for a command that prints JSON', () => {
    expect(renderingFor('run-state')).to.eq(undefined)
  })
})
