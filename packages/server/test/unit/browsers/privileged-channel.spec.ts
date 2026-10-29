import path from 'path'
import { createHash, webcrypto } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs } from '../../../lib/util/fs'

const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

const invokeAndVerify = (onCommandInvocation) => {
  return onCommandInvocation({ name: 'task', args: ['foo'] }).verify('2{"task":"foo"}', [])
}

describe('privileged channel', () => {
  let runPrivilegedChannel
  let win
  let specStack: string

  beforeEach(async () => {
    const secureChannelScript = (await fs.readFileAsync(path.join(__dirname, '..', '..', '..', 'lib', 'privileged-commands', 'privileged-channel.js'))).toString()

    specStack = 'Error: command stack error\n    at http://localhost:1234/__cypress/tests?p=cypress/e2e/spec.cy.js:1:1'

    const ErrorStub = function (message) {
      const err = new Error(message)

      err.stack = specStack

      return err
    }

    ErrorStub.captureStackTrace = vi.fn()

    // need to pull out the methods like this so when they're overwritten
    // in the tests, they don't mess up the actual globals since the test
    // runner itself relies on them
    win = {
      Array: {
        prototype: {
          filter: Array.prototype.filter,
          includes: Array.prototype.includes,
        },
      },
      Error: ErrorStub,
      Cypress: {
        on () {},
      },
      decodeURIComponent,
      fetch: vi.fn(async () => {}),
      location: {
        origin: 'http://localhost:1234',
      },
      JSON: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      String: { prototype: {
        includes: String.prototype.includes,
        replace: String.prototype.replace,
        split: String.prototype.split,
      } },
      TextEncoder: class extends TextEncoder {},
      Uint8Array,
      Uint32Array,
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
    it('Error', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.Error).not.toHaveBeenCalled()
    })

    it('Error.captureStackTrace', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Error.captureStackTrace = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.Error.captureStackTrace).not.toHaveBeenCalled()
    })

    it('Array.prototype.filter', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.filter = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.Array.prototype.filter).not.toHaveBeenCalled()
    })

    it('Array.prototype.includes', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.Array.prototype.includes = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.Array.prototype.includes).not.toHaveBeenCalled()
    })

    it('String.prototype.split', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.split = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.String.prototype.split).not.toHaveBeenCalled()
    })

    it('String.prototype.replace', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.replace = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.String.prototype.replace).not.toHaveBeenCalled()
    })

    it('String.prototype.includes', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.String.prototype.includes = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.String.prototype.includes).not.toHaveBeenCalled()
    })

    it('decodeURIComponent', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      // in the browser, win is the global the script would otherwise read it from
      win.decodeURIComponent = vi.fn(() => '')
      vi.stubGlobal('decodeURIComponent', win.decodeURIComponent)
      specStack = 'Error: command stack error\n    at http://localhost:1234/app.js:1:1'

      try {
        expect(onCommandInvocation({ name: 'readFile', args: ['foo.json'] })).toBeUndefined()
        expect(win.decodeURIComponent).not.toHaveBeenCalled()
      } finally {
        vi.unstubAllGlobals()
      }
    })

    it('fetch', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()
      const originalFetch = win.fetch

      win.fetch = vi.fn(async () => {})

      await invokeAndVerify(onCommandInvocation)

      expect(win.fetch).not.toHaveBeenCalled()
      expect(originalFetch).toHaveBeenCalled()
    })

    it('TextEncoder.prototype.encode', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.TextEncoder.prototype.encode = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.TextEncoder.prototype.encode).not.toHaveBeenCalled()
    })

    it('JSON.stringify', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.stringify = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.JSON.stringify).not.toHaveBeenCalled()
    })

    it('JSON.parse', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      win.JSON.parse = vi.fn()

      await invokeAndVerify(onCommandInvocation)

      expect(win.JSON.parse).not.toHaveBeenCalled()
    })
  })

  describe('#onCommandInvocation', () => {
    it('does not verify a command that is not privileged', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      expect(onCommandInvocation({ name: 'get', args: [] })).toBeUndefined()
    })

    it('does not verify a privileged command invoked outside the spec frame', () => {
      const { onCommandInvocation } = runPrivilegedChannel()

      specStack = 'Error: command stack error\n    at http://localhost:1234/app.js:1:1'

      expect(onCommandInvocation({ name: 'readFile', args: ['foo.json'] })).toBeUndefined()
    })

    it('posts the hash of the encoded options the command will run with', async () => {
      const { onCommandInvocation } = runPrivilegedChannel()
      const packet = '51-[{"fileName":"foo.bin","contents":{"_placeholder":true,"num":0}}]'
      const contents = new Uint8Array([1, 2, 3])

      await onCommandInvocation({ name: 'writeFile', args: ['foo.bin'] }).verify(packet, [contents])

      expect(win.fetch).toHaveBeenCalledWith('http://localhost:1234/__cypress/add-verified-command', expect.anything())

      expect(JSON.parse(win.fetch.mock.calls[0][1].body)).toStrictEqual({
        hash: sha256(JSON.stringify([packet, [sha256(contents)]])),
        name: 'writeFile',
        key: '1234',
        url: 'http://localhost:12345/__cypress/tests?p=cypress/integration/some-spec.js',
      })
    })

    it('verifies the same options again for a retried command', async () => {
      const { verify } = runPrivilegedChannel().onCommandInvocation({ name: 'readFile', args: ['foo.json'] })

      await verify('2{"file":"foo.json"}', [])
      await verify('2{"file":"foo.json"}', [])

      expect(win.fetch).toHaveBeenCalledTimes(2)
    })

    it('does not verify options other than the ones first verified', async () => {
      const { verify } = runPrivilegedChannel().onCommandInvocation({ name: 'readFile', args: ['foo.json'] })

      await verify('2{"file":"foo.json"}', [])
      await verify('2{"file":"bar.json"}', [])

      expect(win.fetch).toHaveBeenCalledTimes(1)
    })

    it('hashes the same with crypto.subtle in a secure context', async () => {
      const packet = '2{"file":"foo.json"}'
      const contents = new Uint8Array([1, 2, 3])

      await runPrivilegedChannel().onCommandInvocation({ name: 'readFile', args: ['foo.json'] }).verify(packet, [contents])

      win.isSecureContext = true
      win.crypto = { subtle: webcrypto.subtle }

      await runPrivilegedChannel().onCommandInvocation({ name: 'readFile', args: ['foo.json'] }).verify(packet, [contents])

      const [jsBody, subtleBody] = win.fetch.mock.calls.map(([, init]) => JSON.parse(init.body))

      expect(subtleBody.hash).toBe(jsBody.hash)
      expect(subtleBody.hash).toBe(sha256(JSON.stringify([packet, [sha256(contents)]])))
    })
  })

  describe('#sha256', () => {
    it('matches the server across message lengths and multi-byte characters', async () => {
      const { sha256: channelSha256 } = runPrivilegedChannel()

      // 55 and 56 bytes straddle the padding boundary of a single block
      const values = ['', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000), 'héllo 👋 \u2028', '\ud800']

      for (const value of values) {
        const bytes = new TextEncoder().encode(value)

        expect(await channelSha256(bytes)).toBe(sha256(bytes))
      }
    })
  })
})
