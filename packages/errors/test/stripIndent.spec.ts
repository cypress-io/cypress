import { describe, it, expect } from 'vitest'
import { stripIndent } from '../src/stripIndent'

describe('src/stripIndent', () => {
  it('does not trip right end', () => {
    const str = stripIndent`\
      There was an error reconnecting to the Chrome DevTools protocol. Please restart the browser.

      [Stack Trace]
    `

    expect(str).toEqual(`
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

    expect(str).toEqual(`
Something went wrong.

- a
- b
- c`.trimLeft())
  })
})
