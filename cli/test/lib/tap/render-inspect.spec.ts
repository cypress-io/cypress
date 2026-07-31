import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderInspectHuman } from '../../../lib/tap/render/inspect'
import type { FrameInspectResult } from '../../../lib/tap/commands/inspect'

const render = (result: FrameInspectResult): string => stripAnsi(renderInspectHuman(result))

describe('lib/tap/render/inspect', () => {
  it('renders a found element as header + attribute/accessibility/box/style sections', () => {
    const output = render({
      url: 'http://localhost:3000',
      selector: '[data-testid=username]',
      found: true,
      tag: 'input',
      attributes: { 'data-testid': 'username', name: 'username' },
      aria: { role: 'textbox', name: 'Username', states: ['disabled'] },
      box: { x: 8, y: 40, width: 200, height: 30 },
      styles: { display: 'block', color: 'rgb(0, 0, 0)' },
    })

    expect(output).toBe([
      'input  [data-testid=username]  http://localhost:3000',
      '',
      'ATTRIBUTES (2)',
      '  data-testid  username',
      '  name         username',
      '',
      'ACCESSIBILITY',
      '  role    textbox',
      '  name    Username',
      '  states  disabled',
      '',
      'BOX',
      '  x 8   y 40   width 200   height 30',
      '',
      'STYLES (2)',
      '  display  block',
      '  color    rgb(0, 0, 0)',
    ].join('\n'))
  })

  it('renders a not-found result on a single line', () => {
    expect(render({ url: 'http://x/', selector: '.missing', found: false })).toBe('.missing  not found  http://x/')
  })

  it('omits the accessibility block when there is no aria node', () => {
    const output = render({ selector: 'div', found: true, tag: 'div', attributes: { id: 'x' } })

    expect(output).not.toContain('ACCESSIBILITY')
    expect(output).toContain('ATTRIBUTES (1)')
  })
})
