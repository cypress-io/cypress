import { describe, it, expect } from 'vitest'
import { DEBUG_PREFIX } from '../constants'

describe('DEBUG_PREFIX', () => {
  // Lines captured from the `debug` package with DEBUG_COLORS=1 and DEBUG_COLORS=0
  const realDebugOutput: [string, boolean][] = [
    ['  \u001b[35;1mcypress:server:util \u001b[0mloaded C:\\Users\\Jane Doe\\proj \u001b[35m+0ms\u001b[0m', true],
    ['  \u001b[32;1mcypress:server:browsers:electron \u001b[0mlaunching \u001b[32m+0ms\u001b[0m', true],
    ['  \u001b[32;1mcypress:stderr \u001b[0mmulti', true],
    ['  \u001b[32;1mcypress:stderr \u001b[0mline \u001b[32m+0ms\u001b[0m', true],
    ['2026-11-20T02:54:28.022Z cypress:server:util loaded C:\\Users\\Jane Doe\\proj', false],
    ['2026-11-20T02:54:28.024Z cypress:stderr multi', false],
    ['line', false],
  ]

  const edgeCases: [string, boolean][] = [
    ['', false],
    ['   ', false],
    ['cypress:server no indent', false],
    ['  cypress:server:util message', true],
    ['\tcypress:server tab indent', true],
    ['  \u001b[38;5;45;1mcypress:server:util \u001b[0m256-color code', true],
    ['  \u001b[36;1m\u001b[1mcypress:proxy stacked codes', true],
    ['  cypress no colon in namespace', false],
    ['  \u001b[36;1mcypress \u001b[0mno colon', false],
    ['  :leading colon only', false],
    ['  ::double colon', true],
    ['  \u001b[36m:colon right after color code', true],
    ['  a:', true],
    ['  C:\\Users\\Jane Doe\\AppData\\Local\\Cypress', true],
    ['  at Object.<anonymous> (C:\\Users\\Jane Doe\\proj\\index.js:1:1)', false],
    ['  at node:internal/main:1:1', false],
    ['  first line\n  cypress:server second line', false],
    ['  cypress:server first line\nsecond line', true],
  ]

  it.each([...realDebugOutput, ...edgeCases])('matches %j: %s', (line, expected) => {
    expect(DEBUG_PREFIX.test(line)).toBe(expected)
  })

  // A `g` or `y` flag would make `test` resume from the last match's `lastIndex`
  it('gives the same answer for the same line on repeated calls', () => {
    const [[line]] = realDebugOutput

    expect([DEBUG_PREFIX.test(line), DEBUG_PREFIX.test(line), DEBUG_PREFIX.test(line)]).toEqual([true, true, true])
  })

  describe('adversarial input', () => {
    const cases: [string, string, boolean][] = [
      ['repeated ANSI codes with no colon', `\t${'\u001b[m'.repeat(16_667)}!`, false],
      ['repeated ANSI codes then a namespace', `  ${'\u001b[m'.repeat(16_667)}cypress:server`, true],
      ['a 50,000-character word with no colon', `  ${'a'.repeat(50_000)}`, false],
      ['a 50,000-character namespace', `  ${'a:'.repeat(25_000)}`, true],
      ['50,000 characters of indentation', `${' '.repeat(50_000)}x`, false],
    ]

    it.each(cases)('handles %s in linear time', (_name, input, expected) => {
      const start = performance.now()

      expect(DEBUG_PREFIX.test(input)).toBe(expected)
      expect(performance.now() - start).toBeLessThan(200)
    })
  })
})
