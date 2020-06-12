import '../../spec_helper'

import { expect } from 'chai'
import { stripIndent } from '../../../lib/util/strip_indent'

describe('lib/util/strip_indent', () => {
  it('does not trip right end', () => {
    const str = stripIndent`\
      There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

      [Stack Trace]
    `

    expect(str).to.eq(`
There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

[Stack Trace]
`.trimLeft())
  })

  it('works well with multi-line argument', () => {
    const arg = [
      '- a',
      '- b',
      '- c',
    ].join('\n')

    const str = stripIndent`
      Something went wrong.

      ${arg}`

    expect(str).to.eq(`
Something went wrong.

- a
- b
- c`.trimLeft())
  })
})
