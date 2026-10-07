import path from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs } from '../../../lib/util/fs'

describe('privileged channel', () => {
  let runPrivilegedChannel
  let win

  beforeEach(async () => {
    const secureChannelScript = (await fs.readFileAsync(path.join(__dirname, '..', '..', '..', 'lib', 'privileged-commands', 'privileged-channel.js'))).toString()
    const ErrorStub = function (message) {
      return new Error(message)
    }

    ErrorStub.captureStackTrace = vi.fn()

    // need to pull out the methods like this so when they're overwritten
    // in the tests, they don't mess up the actual globals since the test
    // runner itself relies on them
    win = {
      Array: {
        isArray: Array.isArray,
        prototype: {
          filter: Array.prototype.filter,
          includes: Array.prototype.includes,
          map: Array.prototype.map,
          slice: Array.prototype.slice,
        },
      },
      Error: ErrorStub,
      Cypress: {
        on () {},
      },
      fetch: vi.fn(async () => {}),
      Function: { prototype: {
        toString: Function.prototype.toString,
      } },
      location: {
        origin: 'http://localhost:1234',
      },
      Math: {
        imul: Math.imul,
      },
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      String: { prototype: {
        charCodeAt: String.prototype.charCodeAt,
        includes: String.prototype.includes,
        replace: String.prototype.replace,
        split: String.prototype.split,
      } },
    }

    runPrivilegedChannel = () => {
      return eval(`${secureChannelScript}`)({
        browserFamily: 'chromium',
        isSpecBridge: false,
        key: '1234',
        namespace: '__cypress',
        scripts: JSON.stringify(['cypress/e2e/spec.cy.js']),
        url: 'http://localhost:12345/__cypress/tests?p=cypress/integration/some-spec.js',
        win,
      })
    }
  })

  describe('overwriting native objects and methods has no effect', () => {
    it('Error', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Error).not.toHaveBeenCalled()
    })

    it('Error.captureStackTrace', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error.captureStackTrace = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Error.captureStackTrace).not.toHaveBeenCalled()
    })

    it('Array.prototype.filter', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.filter = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.filter).not.toHaveBeenCalled()
    })

    it('Array.prototype.includes', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.includes = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.includes).not.toHaveBeenCalled()
    })

    it('Array.prototype.map', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.map = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Array.prototype.map).not.toHaveBeenCalled()
    })

    it('String.prototype.split', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.split = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.split).not.toHaveBeenCalled()
    })

    it('String.prototype.replace', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.replace = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.replace).not.toHaveBeenCalled()
    })

    it('String.prototype.includes', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.includes = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.String.prototype.includes).not.toHaveBeenCalled()
    })

    it('Function.prototype.toString', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Function.prototype.toString = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.Function.prototype.toString).not.toHaveBeenCalled()
    })

    it('fetch', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.fetch = vi.fn(async () => {})

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.fetch).not.toHaveBeenCalled()
    })

    it('JSON.stringify', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.stringify = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.JSON.stringify).not.toHaveBeenCalled()
    })

    it('JSON.parse', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.parse = vi.fn()

      onCommandInvocation({ name: 'task', args: [] })

      expect(win.JSON.parse).not.toHaveBeenCalled()
    })
  })

  describe('#dropRightUndefined', () => {
    it('removes undefined values from the right side of the array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined(['one', 'two'])).toStrictEqual(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined])).toStrictEqual(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined, undefined])).toStrictEqual(['one', 'two'])
      expect(dropRightUndefined(['one', 'two', undefined, null])).toStrictEqual(['one', 'two', undefined, null])
      expect(dropRightUndefined(['one', 'two', null, undefined])).toStrictEqual(['one', 'two', null])
    })

    it('does not remove undefined values from the beginning or middle of the array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined([undefined, 'one', 'two'])).toStrictEqual([undefined, 'one', 'two'])
      expect(dropRightUndefined([undefined, 'one', undefined, 'two'])).toStrictEqual([undefined, 'one', undefined, 'two'])
      expect(dropRightUndefined([undefined, 'one', undefined, 'two', undefined])).toStrictEqual([undefined, 'one', undefined, 'two'])
      expect(dropRightUndefined(['one', undefined, 'two'])).toStrictEqual(['one', undefined, 'two'])
      expect(dropRightUndefined(['one', undefined, 'two', undefined])).toStrictEqual(['one', undefined, 'two'])
    })

    it('returns empty array if not passed an array', () => {
      const { dropRightUndefined } = runPrivilegedChannel()

      expect(dropRightUndefined()).toStrictEqual([])
      expect(dropRightUndefined({})).toStrictEqual([])
      expect(dropRightUndefined(true)).toStrictEqual([])
      expect(dropRightUndefined(123)).toStrictEqual([])
      expect(dropRightUndefined('string')).toStrictEqual([])
    })
  })
})
