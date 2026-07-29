import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderDomHuman } from '../../../lib/tap/render/dom'
import type { FrameDomResult } from '../../../lib/tap/commands/dom'

const render = (result: FrameDomResult): string => stripAnsi(renderDomHuman(result))

describe('lib/tap/render/dom', () => {
  it('renders the whole document under a DOM header with the url', () => {
    expect(render({ url: 'http://localhost:5555/', html: '<html></html>' })).toBe([
      'DOM  http://localhost:5555/',
      '',
      '<html></html>',
    ].join('\n'))
  })

  it('renders each selector match as its own block under a counted header, and notes truncation', () => {
    expect(render({ url: 'http://localhost:5555/', matches: { count: 2, html: ['<a></a>', '<b></b>'] }, truncated: true })).toBe([
      'MATCHES (2)  http://localhost:5555/',
      '',
      '<a></a>',
      '',
      '<b></b>',
      '',
      '(output truncated)',
    ].join('\n'))
  })

  it('notes when a selector matched nothing', () => {
    expect(render({ url: 'http://x/', matches: { count: 0, html: [] } })).toBe('No elements matched the selector.')
  })
})
