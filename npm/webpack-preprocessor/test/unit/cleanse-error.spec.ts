import { describe, expect, it } from 'vitest'
import { cleanseError } from '../../lib/cleanse-error'
import webpackErrors from '../fixtures/errors/webpack-errors.json'

const STACK_FRAME = /\n\s*at.*/g
const PREVIOUS_EVENT = /From previous event:\n?/g

const previousCleanseError = (msg: string) => msg.replace(STACK_FRAME, '').replace(PREVIOUS_EVENT, '')

describe('./lib/cleanse-error', () => {
  it('drops the babel stack from a real webpack syntax error', () => {
    const cleansed = cleanseError(webpackErrors.babelSyntaxError)

    expect(cleansed).not.toContain('    at ')
    expect(cleansed.endsWith(' 2 |\u001b[39m\u001b[0m')).toBe(true)
  })

  it.each([
    ['a babel syntax error from webpack', webpackErrors.babelSyntaxError],
    ['a module-not-found error from webpack', webpackErrors.moduleNotFound],
    // Inputs below follow the shape of a Node stack trace rather than captured output.
    ['a Bluebird long stack trace', 'Error: boom\n    at a (a.js:1:1)\nFrom previous event:\n    at b (b.js:2:2)'],
    ['blank lines before a frame', 'Error: boom\n\n  \n    at a (a.js:1:1)'],
    ['a Windows stack trace', 'Error: boom\r\n    at a (C:\\Users\\jane\\project\\a.js:1:1)\r\n    at b (C:\\Users\\jane\\project\\b.js:2:2)'],
    ['trailing whitespace after the message', 'Error: boom  \n    at a (a.js:1:1)'],
    ['a line starting with "at" that is not a frame', 'Error: boom\nattempted to read undefined'],
    ['a frame on the first line', 'at a (a.js:1:1)'],
    ['whitespace runs without frames', 'Error: boom\n\n\n  done\n'],
    ['an empty string', ''],
  ])('matches the previous regexes for %s', (_label, message) => {
    expect(cleanseError(message)).toBe(previousCleanseError(message))
  })

  it('reads the message off a webpack StatsError', () => {
    expect(cleanseError({ message: webpackErrors.babelSyntaxError } as any)).toBe(previousCleanseError(webpackErrors.babelSyntaxError))
  })

  it('keeps 50,000 newlines without a frame in linear time', () => {
    const message = `Error: boom${'\n'.repeat(50_000)}x`
    const start = performance.now()

    expect(cleanseError(message)).toBe(message)
    expect(performance.now() - start).toBeLessThan(200)
  })
})
