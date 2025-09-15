import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import os from 'os'
import si from 'systeminformation'
import path from 'path'
import nock from 'nock'
import hasha from 'hasha'
import createDebug from 'debug'
import execa from 'execa'
import fs from 'fs-extra'
import { Console } from 'console'

import normalize from '../../support/normalize'
import logger from '../../../lib/logger'
import util from '../../../lib/util'
import download from '../../../lib/tasks/download'

const debug = createDebug('test')

const downloadDestination = path.join(os.tmpdir(), 'Cypress', 'download', 'cypress.zip')
const version = '1.2.3'
const examplePath = 'test/fixture/example.zip'

vi.mock('execa')

vi.mock('systeminformation', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('fs-extra', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      ensureDir: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgVersion: vi.fn(),
      cwd: vi.fn(),
    },
  }
})

describe('lib/tasks/download', function () {
  const rootFolder = '/home/user/git'
  let options: any

  const createStdoutCapture = () => {
    const logs: string[] = []
    // eslint-disable-next-line no-console
    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array<ArrayBufferLike>) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }

  // Direct console to process.stdout/stderr
  let originalConsole: Console

  beforeEach(async () => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()

    nock.cleanAll()
    // make sure to clear out the cached arch in the util singleton
    util._cachedArch = undefined

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)

    logger.reset()

    options = {
      downloadDestination,
      version,
    }

    // @ts-expect-error mockReturnValue
    os.platform.mockReturnValue('OS')
    // @ts-expect-error mockReturnValue
    util.pkgVersion.mockReturnValue('1.2.3')
    // @ts-expect-error mockResolvedValue
    si.osInfo.mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    })

    // @ts-expect-error mockReturnValue
    util.cwd.mockReturnValue(rootFolder)

    const actualFsExtra = await vi.importActual<typeof import('fs-extra')>('fs-extra')

    // @ts-expect-error - mockImplementation to pass through to the actual implementation to prevent issues with request-progress
    fs.ensureDir.mockImplementation(actualFsExtra.ensureDir)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
  })

  describe('download url', () => {
    it('returns url', () => {
      const url = download.getUrl('ARCH')

      expect(() => new URL(url)).not.toThrow()
    })

    it('returns latest desktop url', () => {
      const url = download.getUrl('ARCH')

      expect(normalize(url)).toMatchSnapshot('latest desktop url 1')
    })

    it('returns specific desktop version url', () => {
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('specific version desktop url 1')
    })

    it('returns custom url from template', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', '${endpoint}/${platform}-${arch}/cypress.zip')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template')
    })

    it('returns custom url from template with version', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', 'https://mycompany/${version}/${platform}-${arch}/cypress.zip')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template with version')
    })

    it('returns custom url from template with multiple replacements', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', '${endpoint}/${platform}/${arch}/cypress-${version}-${platform}-${arch}.zip?referrer=${endpoint}&version=${version}')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template with multiple replacements')
    })

    it('returns custom url from template with escaped dollar sign', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', '\\${endpoint}/\\${platform}-\\${arch}/cypress.zip')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template with escaped dollar sign')
    })

    it('returns custom url from template wrapped in quote', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', '"${endpoint}/${platform}-${arch}/cypress.zip"')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template wrapped in quote')
    })

    it('returns custom url from template with escaped dollar sign wrapped in quote', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_PATH_TEMPLATE', '"\\${endpoint}/\\${platform}-\\${arch}/cypress.zip"')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('desktop url from template with escaped dollar sign wrapped in quote')
    })

    it('returns input if it is already an https link', () => {
      const url = 'https://somewhere.com'
      const result = download.getUrl('ARCH', url)

      expect(result).toEqual(url)
    })

    it('returns input if it is already an http link', () => {
      const url = 'http://local.com'
      const result = download.getUrl('ARCH', url)

      expect(result).toEqual(url)
    })
  })

  describe('download base url from CYPRESS_DOWNLOAD_MIRROR env var', () => {
    it('env var', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_MIRROR', 'https://cypress.example.com')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('base url from CYPRESS_DOWNLOAD_MIRROR 1')
    })

    it('env var with trailing slash', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_MIRROR', 'https://cypress.example.com/')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('base url from CYPRESS_DOWNLOAD_MIRROR with trailing slash 1')
    })

    it('env var with subdirectory', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_MIRROR', 'https://cypress.example.com/example')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory 1')
    })

    it('env var with subdirectory and trailing slash', () => {
      vi.stubEnv('CYPRESS_DOWNLOAD_MIRROR', 'https://cypress.example.com/example/')
      const url = download.getUrl('ARCH', '0.20.2')

      expect(normalize(url)).toMatchSnapshot('base url from CYPRESS_DOWNLOAD_MIRROR with subdirectory and trailing slash 1')
    })
  })

  it('saves example.zip to options.downloadDestination', async function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    const onProgress = vi.fn().mockReturnValue(undefined)

    const responseVersion = await download.start({
      downloadDestination: options.downloadDestination,
      version: options.version,
      progress: { onProgress },
    })

    expect(responseVersion).to.eq('0.11.1')

    await fs.stat(downloadDestination)
  })

  describe('verify downloaded file', function () {
    let expectedChecksum: string
    let expectedFileSize: number
    let onProgress: vi.Mock

    beforeEach(function () {
      expectedChecksum = hasha.fromFileSync(examplePath)

      expectedFileSize = fs.statSync(examplePath).size

      onProgress = vi.fn().mockReturnValue(undefined)
      debug('example file %s should have checksum %s and file size %d',
        examplePath, expectedChecksum, expectedFileSize)
    })

    it('throws if file size is different from expected', async function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        // definitely incorrect file size
        'content-length': '10',
      })

      await expect(download.start({
        downloadDestination: options.downloadDestination,
        version: options.version,
        progress: { onProgress },
      })).rejects.toThrow()
    })

    it('throws if file size is different from expected x-amz-meta-size', async function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        // definitely incorrect file size
        'x-amz-meta-size': '10',
      })

      await expect(download.start({
        downloadDestination: options.downloadDestination,
        version: options.version,
        progress: { onProgress },
      })).rejects.toThrow()
    })

    it('throws if checksum is different from expected', async function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': 'incorrect-checksum',
      })

      await expect(download.start({
        downloadDestination: options.downloadDestination,
        version: options.version,
        progress: { onProgress },
      })).rejects.toThrow()
    })

    it('throws if checksum and file size are different from expected', async function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': 'incorrect-checksum',
        'x-amz-meta-size': '10',
      })

      await expect(download.start({
        downloadDestination: options.downloadDestination,
        version: options.version,
        progress: { onProgress },
      })).rejects.toThrow()
    })

    it('passes when checksum and file size match', async function () {
      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(200, () => {
        debug('creating read stream for %s', examplePath)

        return fs.createReadStream(examplePath)
      }, {
        'x-amz-meta-checksum': expectedChecksum,
        'x-amz-meta-size': String(expectedFileSize),
      })

      debug('downloading %s to %s for test version %s',
        examplePath, options.downloadDestination, options.version)

      await download.start({
        downloadDestination: options.downloadDestination,
        version: options.version,
        progress: { onProgress },
      })
    })
  })

  it('resolves with response x-version if present', async function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.1',
    })

    const responseVersion = await download.start(options)

    expect(responseVersion).to.eq('0.11.1')
  })

  it('handles quadruple redirect with response x-version to the latest if present', async function () {
    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
    })

    nock('https://aws.amazon.com')
    .get('/someone.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/somebody.zip',
      'x-version': '0.11.2',
    })

    nock('https://aws.amazon.com')
    .get('/something.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.11.4',
    })

    nock('https://aws.amazon.com')
    .get('/somebody.zip')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/something.zip',
      'x-version': '0.11.3',
    })

    nock('https://download.cypress.io')
    .get('/desktop/1.2.3')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/someone.zip',
      'x-version': '0.11.1',
    })

    const responseVersion = await download.start(options)

    expect(responseVersion).to.eq('0.11.4')
  })

  it('errors on too many redirects', async function () {
    function stubRedirects () {
      nock('https://aws.amazon.com')
      .get('/some.zip')
      .reply(200, () => {
        return fs.createReadStream(examplePath)
      })

      nock('https://download.cypress.io')
      .get('/desktop/1.2.3')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/someone.zip',
        'x-version': '0.11.1',
      })

      nock('https://aws.amazon.com')
      .get('/someone.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somebody.zip',
        'x-version': '0.11.2',
      })

      nock('https://aws.amazon.com')
      .get('/somebody.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/something.zip',
        'x-version': '0.11.3',
      })

      nock('https://aws.amazon.com')
      .get('/something.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewhat.zip',
        'x-version': '0.11.4',
      })

      nock('https://aws.amazon.com')
      .get('/somewhat.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/sometime.zip',
        'x-version': '0.11.5',
      })

      nock('https://aws.amazon.com')
      .get('/sometime.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewhen.zip',
        'x-version': '0.11.6',
      })

      nock('https://aws.amazon.com')
      .get('/somewhen.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somewise.zip',
        'x-version': '0.11.7',
      })

      nock('https://aws.amazon.com')
      .get('/somewise.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/someways.zip',
        'x-version': '0.11.8',
      })

      nock('https://aws.amazon.com')
      .get('/someways.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somerset.zip',
        'x-version': '0.11.9',
      })

      nock('https://aws.amazon.com')
      .get('/somerset.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/somedeal.zip',
        'x-version': '0.11.10',
      })

      nock('https://aws.amazon.com')
      .get('/somedeal.zip')
      .query(true)
      .reply(302, undefined, {
        Location: 'https://aws.amazon.com/some.zip',
        'x-version': '0.11.11',
      })
    }

    stubRedirects()

    try {
      await download.start(options)
      throw new Error('should have caught')
    } catch (error) {
      expect(error).to.be.instanceof(Error)
      expect(error.message).to.contain('redirect loop')
    }

    stubRedirects()

    // Double check to make sure that raising redirectTTL changes result
    const responseVersion = await download.start({ ...options, redirectTTL: 12 })

    expect(responseVersion).to.eq('0.11.11')
  })

  it('can specify cypress version in arguments', async function () {
    options.version = '0.13.0'

    nock('https://aws.amazon.com')
    .get('/some.zip')
    .reply(200, () => {
      return fs.createReadStream(examplePath)
    })

    nock('https://download.cypress.io')
    .get('/desktop/0.13.0')
    .query(true)
    .reply(302, undefined, {
      Location: 'https://aws.amazon.com/some.zip',
      'x-version': '0.13.0',
    })

    const responseVersion = await download.start(options)

    expect(responseVersion).to.eq('0.13.0')

    await fs.stat(downloadDestination)
  })

  describe('architecture detection', () => {
    describe('Apple Silicon/M1', () => {
      function nockDarwinArm64 () {
        return nock('https://download.cypress.io')
        .get('/desktop/1.2.3')
        .query({ arch: 'arm64', platform: 'darwin' })
        .reply(200, undefined, {
          'x-version': '1.2.3',
        })
      }

      it('downloads darwin-arm64 on M1', async function () {
        // @ts-expect-error mockReturnValue
        os.platform.mockReturnValue('darwin')

        // @ts-expect-error mockReturnValue
        os.arch.mockReturnValue('arm64')

        nockDarwinArm64()

        const responseVersion = await download.start(options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.stat(downloadDestination)
      })

      it('downloads darwin-arm64 on M1 translated by Rosetta', async function () {
        // @ts-expect-error mockReturnValue
        os.platform.mockReturnValue('darwin')
        // @ts-expect-error mockReturnValue
        os.arch.mockReturnValue('x64')

        nockDarwinArm64()

        // @ts-expect-error mockImplementation
        execa.mockImplementation((command, args, options) => {
          if (command === 'sysctl' && args[0] === '-n' && args[1] === 'sysctl.proc_translated') {
            return Promise.resolve({
              // will force arm64 inside util.getRealArch()
              stdout: '1',
            })
          }
        })

        const responseVersion = await download.start(options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.stat(downloadDestination)
      })
    })

    describe('Linux arm64/aarch64', () => {
      function nockLinuxArm64 () {
        return nock('https://download.cypress.io')
        .get('/desktop/1.2.3')
        .query({ arch: 'arm64', platform: 'linux' })
        .reply(200, undefined, {
          'x-version': '1.2.3',
        })
      }

      it('downloads linux-arm64 on arm64 processor', async function () {
        // @ts-expect-error mockReturnValue
        os.platform.mockReturnValue('linux')
        // @ts-expect-error mockReturnValue
        os.arch.mockReturnValue('arm64')

        nockLinuxArm64()

        const responseVersion = await download.start(options)

        expect(responseVersion).to.eq('1.2.3')

        await fs.stat(downloadDestination)
      })

      it('downloads linux-arm64 on non-arm64 node running on arm machine', async function () {
        // @ts-expect-error mockReturnValue
        os.platform.mockReturnValue('linux')
        // @ts-expect-error mockReturnValue
        os.arch.mockReturnValue('x64')

        for (const arch of ['aarch64_be', 'aarch64', 'armv8b', 'armv8l']) {
          nockLinuxArm64()

          // @ts-expect-error mockImplementation
          execa.mockImplementation((command, args, options) => {
            if (command === 'uname' && args[0] === '-m') {
              return Promise.resolve({
                // will force arm64 inside util.getRealArch()
                stdout: arch,
              })
            }
          })

          const responseVersion = await download.start(options)

          expect(responseVersion).to.eq('1.2.3')

          await fs.stat(downloadDestination)
        }
      })
    })
  })

  it('catches download status errors and exits', async function () {
    const output = createStdoutCapture()

    const err: any = new Error()

    err.statusCode = 404
    err.statusMessage = 'Not Found'

    options.version = null

    // not really the download error, but the easiest way to
    // test the error handling
    // @ts-expect-error mockRejectedValue
    fs.ensureDir.mockRejectedValue(err)

    try {
      await download.start(options)
      throw new Error('should have caught')
    } catch (error) {
      expect(error.message).not.toEqual('should have caught')
      logger.error(error)

      expect(output()).toMatchSnapshot('download status errors 1')
    }
  })
})

describe('with proxy env vars', () => {
  const testUriHttp = 'http://anything.com'
  const testUriHttps = 'https://anything.com'

  beforeEach(function () {
    // prevent ambient environment masking of environment variables referenced in this test
    vi.unstubAllEnvs()

    // add a default no_proxy which does not match the testUri
    vi.stubEnv('NO_PROXY', 'localhost,.org')
  })

  it('uses http_proxy on http request', () => {
    vi.stubEnv('http_proxy', 'http://foo')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).toEqual('http://foo')
  })

  it('ignores http_proxy on https request', () => {
    vi.stubEnv('http_proxy', 'http://foo')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual(null)
    vi.stubEnv('https_proxy', 'https://bar')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('https://bar')
  })

  it('falls back to npm_config_proxy', () => {
    vi.stubEnv('npm_config_proxy', 'http://foo')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('http://foo')
    vi.stubEnv('npm_config_https_proxy', 'https://bar')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('https://bar')
    vi.stubEnv('https_proxy', 'https://baz')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('https://baz')
  })

  it('respects no_proxy on http and https requests', () => {
    vi.stubEnv('NO_PROXY', 'localhost,.com')

    vi.stubEnv('http_proxy', 'http://foo')
    vi.stubEnv('https_proxy', 'https://bar')

    expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).toBeNull()
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toBeNull()
  })

  it('ignores no_proxy for npm proxy configs, prefers https over http', () => {
    vi.stubEnv('NO_PROXY', 'localhost,.com')

    vi.stubEnv('npm_config_proxy', 'http://foo')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).toEqual('http://foo')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('http://foo')

    vi.stubEnv('npm_config_https_proxy', 'https://bar')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttp)).toEqual('https://bar')
    expect(download.getProxyForUrlWithNpmConfig(testUriHttps)).toEqual('https://bar')
  })
})

describe('with CA and CAFILE env vars', () => {
  it('returns undefined if not set', async () => {
    const ca = await download.getCA()

    expect(ca).toBeUndefined()
  })

  it('returns CA from npm_config_ca', async () => {
    vi.stubEnv('npm_config_ca', 'foo')

    const ca = await download.getCA()

    expect(ca).toEqual('foo')
  })

  it('returns CA from npm_config_cafile', async () => {
    vi.stubEnv('npm_config_cafile', 'test/fixture/cafile.pem')

    const ca = await download.getCA()

    expect(ca).toEqual('bar\n')
  })

  it('returns undefined if failed reading npm_config_cafile', async () => {
    vi.stubEnv('npm_config_cafile', 'test/fixture/not-exists.pem')

    const ca = await download.getCA()

    expect(ca).toBeUndefined()
  })
})
