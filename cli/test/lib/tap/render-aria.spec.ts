import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderAriaHuman } from '../../../lib/tap/render/aria'
import type { FrameAriaResult } from '../../../lib/tap/commands/aria'

const render = (result: FrameAriaResult): string => stripAnsi(renderAriaHuman(result))

describe('lib/tap/render/aria', () => {
  it('renders an indented role tree with names, values, states, and a truncation note', () => {
    const output = render({
      url: 'http://localhost:3000',
      nodeCount: 4,
      nodes: [
        { depth: 0, role: 'RootWebArea', name: 'Login' },
        { depth: 1, role: 'heading', name: 'Sign in' },
        { depth: 1, role: 'textbox', name: 'Username', value: 'ada', states: ['disabled'] },
        { depth: 1, role: 'button', name: 'Submit' },
      ],
      truncated: true,
    })

    expect(output).toBe([
      'ARIA (4)  http://localhost:3000',
      '  RootWebArea  Login',
      '    heading  Sign in',
      '    textbox  Username = ada  [disabled]',
      '    button  Submit',
      '',
      '(output truncated)',
    ].join('\n'))
  })

  it('notes when the tree is empty', () => {
    expect(render({ nodes: [], nodeCount: 0 })).toBe('No accessibility nodes found.')
  })
})
