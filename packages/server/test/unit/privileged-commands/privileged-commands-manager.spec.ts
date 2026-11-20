import { createHash } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { encodeEventParts } from '@packages/socket'
import * as files from '../../../lib/files'
import { privilegedCommandsManager } from '../../../lib/privileged-commands/privileged-commands-manager'

vi.mock('../../../lib/files', () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }
})

const specFrameUrl = 'http://localhost:2020/__cypress/iframes/cypress/e2e/spec.cy.js'
const specFrameOrigin = 'http://localhost:2020'
const specBridgeUrl = 'http://foobar.com:3500/__cypress/spec-bridge-iframes?browserFamily=chromium'
const e2eConfig = { testingType: 'e2e', projectRoot: '/project' }

const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

const hash = (options: unknown) => {
  const [packet, ...binaries] = encodeEventParts(options)

  return sha256(JSON.stringify([packet, binaries.map(sha256)]))
}

const getSpecFrameKey = async () => {
  const channel = await privilegedCommandsManager.getPrivilegedChannel({
    browserFamily: 'chromium',
    isSpecBridge: false,
    namespace: '__cypress',
    scripts: [],
    url: specFrameUrl,
    documentDomainContext: false,
  })

  return JSON.parse(channel!.match(/\n\s*key: (.+),\n/)![1])
}

const getChannelOptions = async (options: any) => {
  const channel = await privilegedCommandsManager.getPrivilegedChannel({
    browserFamily: 'chromium',
    isSpecBridge: false,
    namespace: '__cypress',
    scripts: [{ relativeUrl: '/__cypress/tests?p=cypress/e2e/spec.cy.js' }],
    url: 'http://localhost:2020/__cypress/iframes/cypress/e2e/spec.cy.js',
    documentDomainContext: false,
    ...options,
  })

  return channel!.slice(channel!.lastIndexOf('browserFamily:'))
}

describe('lib/privileged-commands/privileged-commands-manager', () => {
  beforeEach(() => {
    privilegedCommandsManager.reset()
  })

  describe('#getPrivilegedChannel', () => {
    it('escapes quotes in the url', async () => {
      const channelOptions = await getChannelOptions({
        url: `http://foo'bar.example.com:2020/__cypress/iframes/spec.cy.js`,
      })

      expect(channelOptions).toContain(`url: "http://foo'bar.example.com:2020/__cypress/iframes/spec.cy.js"`)
    })

    it('escapes quotes in the browser family', async () => {
      const channelOptions = await getChannelOptions({
        browserFamily: `chromium',extra:(1),x:'`,
      })

      expect(channelOptions).toContain(`browserFamily: "chromium',extra:(1),x:'"`)
    })

    it('escapes quotes in the spec scripts', async () => {
      const channelOptions = await getChannelOptions({
        scripts: [{ relativeUrl: `/__cypress/tests?p=x',extra:(1),y:'` }],
      })

      expect(channelOptions).toContain(`scripts: "[\\"/__cypress/tests?p=x',extra:(1),y:'\\"]"`)
    })

    it('preserves backslashes in the spec scripts', async () => {
      const relativeUrl = `/__cypress/tests?p=cypress\\e2e\\nested\\foo.cy.js`
      const channelOptions = await getChannelOptions({
        scripts: [{ relativeUrl }],
      })

      const scriptsLiteral = channelOptions.match(/\n\s*scripts: (.+),\n/)![1]
      const parsedScripts = JSON.parse(JSON.parse(scriptsLiteral))

      expect(parsedScripts).toStrictEqual([relativeUrl])
    })

    it('escapes characters that would end the inline script element', async () => {
      const channelOptions = await getChannelOptions({
        browserFamily: '</script><script>doThing()</script>',
      })

      expect(channelOptions).toContain('browserFamily: "\\u003c/script\\u003e\\u003cscript\\u003edoThing()\\u003c/script\\u003e"')
    })
  })

  describe('#runPrivilegedCommand', () => {
    const readFileOptions = { file: 'foo.json', encoding: 'utf8' }
    let key: string

    beforeEach(async () => {
      key = await getSpecFrameKey()

      vi.mocked(files.readFile).mockReset().mockResolvedValue({ contents: 'contents', filePath: '/project/foo.json' })
      vi.mocked(files.writeFile).mockReset()
    })

    const verify = (options: unknown, overrides = {}) => {
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(options), name: 'readFile', key, url: specFrameUrl, ...overrides }, specFrameOrigin)
    }

    const expectNonSpecError = (fn: () => unknown) => {
      expect(fn).toThrow(expect.objectContaining({ isNonSpec: true }))
    }

    it('runs a command with the options it was verified with', async () => {
      verify(readFileOptions)

      await privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions })

      expect(files.readFile).toHaveBeenCalledWith('/project', readFileOptions)
    })

    it('rejects a command that was not verified', () => {
      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))

      expect(files.readFile).not.toHaveBeenCalled()
    })

    it('rejects a command whose options differ from the verified ones', () => {
      verify(readFileOptions)

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: { file: 'bar.json', encoding: 'utf8' } }))

      expect(files.readFile).not.toHaveBeenCalled()
    })

    it('rejects a command whose name differs from the verified one', () => {
      verify({ fileName: 'foo.json', contents: 'contents' })

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'writeFile', options: { fileName: 'foo.json', contents: 'contents' } }))
    })

    it('allows each verification to run the command once', async () => {
      verify(readFileOptions)

      await privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions })

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))

      expect(files.readFile).toHaveBeenCalledTimes(1)
    })

    it('does not verify a command posted with the wrong key', () => {
      verify(readFileOptions, { key: 'not-the-key' })

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))
    })

    it('does not verify a command posted from a different origin than its channel', () => {
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(readFileOptions), name: 'readFile', key, url: specFrameUrl }, 'http://other.com')

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))
    })

    it('does not verify a command posted without an origin', () => {
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(readFileOptions), name: 'readFile', key, url: specFrameUrl }, undefined)

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))
    })

    it('verifies a command posted without an origin when web security is disabled', () => {
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(readFileOptions), name: 'readFile', key, url: specFrameUrl }, undefined, true)

      privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions })

      expect(files.readFile).toHaveBeenCalled()
    })

    it('does not verify a command posted from a different origin when web security is disabled', () => {
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(readFileOptions), name: 'readFile', key, url: specFrameUrl }, 'http://other.com', true)

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options: readFileOptions }))
    })

    it('runs a command whose binary options match the verified ones', async () => {
      const options = { fileName: 'foo.bin', contents: Buffer.from('contents') }

      vi.mocked(files.writeFile).mockResolvedValue({ contents: options.contents, filePath: '/project/foo.bin' })
      verify(options, { name: 'writeFile' })

      await privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'writeFile', options })

      expect(files.writeFile).toHaveBeenCalledWith('/project', options)
    })

    it('rejects a command whose binary options differ from the verified ones', () => {
      verify({ fileName: 'foo.bin', contents: Buffer.from('contents') }, { name: 'writeFile' })

      expectNonSpecError(() => privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'writeFile', options: { fileName: 'foo.bin', contents: Buffer.from('content!') } }))

      expect(files.writeFile).not.toHaveBeenCalled()
    })

    it('does not require verification in component testing', async () => {
      await privilegedCommandsManager.runPrivilegedCommand({ ...e2eConfig, testingType: 'component' }, { commandName: 'readFile', options: readFileOptions })

      expect(files.readFile).toHaveBeenCalledWith('/project', readFileOptions)
    })
  })

  describe('spec bridge channels', () => {
    const getSpecBridgeChannel = () => {
      return privilegedCommandsManager.getPrivilegedChannel({
        browserFamily: 'chromium',
        isSpecBridge: true,
        namespace: '__cypress',
        scripts: [],
        url: specBridgeUrl,
        documentDomainContext: false,
      })
    }

    const runVerifiedOrigin = async (specBridgeOrigin: string) => {
      const key = await getSpecFrameKey()
      const options = { specBridgeOrigin }

      privilegedCommandsManager.addVerifiedCommand({ hash: hash(options), name: 'origin', key, url: specFrameUrl }, specFrameOrigin)
      await privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'origin', options })
    }

    it('is not issued for an origin the spec has not passed to cy.origin()', async () => {
      expect(await getSpecBridgeChannel()).toBeUndefined()
    })

    it('is issued for an origin passed to a verified cy.origin()', async () => {
      await runVerifiedOrigin('http://foobar.com:3500')

      expect(await getSpecBridgeChannel()).toContain('isSpecBridge: true')
    })

    it('is not issued for a different origin than the one passed to cy.origin()', async () => {
      await runVerifiedOrigin('http://other.com:3500')

      expect(await getSpecBridgeChannel()).toBeUndefined()
    })

    it('is issued once per origin, whatever the url', async () => {
      await runVerifiedOrigin('http://foobar.com:3500')

      expect(await getSpecBridgeChannel()).toContain('url: "http://foobar.com:3500"')

      expect(await privilegedCommandsManager.getPrivilegedChannel({
        browserFamily: 'chromium',
        isSpecBridge: true,
        namespace: '__cypress',
        scripts: [],
        url: `${specBridgeUrl}&other=1`,
        documentDomainContext: false,
      })).toBeUndefined()
    })

    it('accepts verifications posted from the spec bridge origin', async () => {
      await runVerifiedOrigin('http://foobar.com:3500')

      const channel = await getSpecBridgeChannel()
      const key = JSON.parse(channel!.match(/\n\s*key: (.+),\n/)![1])
      const options = { file: 'foo.json', encoding: 'utf8' }

      vi.mocked(files.readFile).mockResolvedValue({ contents: 'contents', filePath: '/project/foo.json' })
      privilegedCommandsManager.addVerifiedCommand({ hash: hash(options), name: 'readFile', key, url: 'http://foobar.com:3500' }, 'http://foobar.com:3500')

      await privilegedCommandsManager.runPrivilegedCommand(e2eConfig, { commandName: 'readFile', options })

      expect(files.readFile).toHaveBeenCalledWith('/project', options)
    })

    it('is not issued once the spec frame starts a new run', async () => {
      await runVerifiedOrigin('http://foobar.com:3500')

      privilegedCommandsManager.reset()

      expect(await getSpecBridgeChannel()).toBeUndefined()
    })
  })
})
