import { describe, expect, it } from 'vitest'
import stripAnsi from 'strip-ansi'

import { renderDomHuman } from '../../../lib/tap/render/dom'
import type { FrameDomResult } from '../../../lib/tap/commands/dom'

const render = (result: FrameDomResult): string => stripAnsi(renderDomHuman(result))

describe('lib/tap/render/dom', () => {
  it('renders the whole document as bare HTML, with nothing framing it', () => {
    expect(render({ html: '<html></html>' })).toBe('<html></html>')
  })

  it('renders the matched element the same way, and notes truncation', () => {
    expect(render({ found: true, html: '<a></a>', truncated: true })).toBe([
      '<a></a>',
      '',
      '(output truncated)',
    ].join('\n'))
  })

  it('pulls a nested element back to the margin, keeping its internal shape', () => {
    // outerHTML as the document had it: the element starts at the margin, its
    // body carries the depth it sat at.
    const html = [
      '<button type="button">',
      '          <span class="icon-bar"></span>',
      '            <em>x</em>',
      '        </button>',
    ].join('\n')

    expect(render({ found: true, html })).toBe([
      '<button type="button">',
      '  <span class="icon-bar"></span>',
      '    <em>x</em>',
      '</button>',
    ].join('\n'))
  })

  it('leaves markup that already sits at the margin alone', () => {
    const html = '<ul>\n<li>a</li>\n</ul>'

    expect(render({ found: true, html })).toBe(html)
  })

  it('notes when a selector matched nothing', () => {
    expect(render({ found: false })).toBe('No element matched the selector.')
  })
})
