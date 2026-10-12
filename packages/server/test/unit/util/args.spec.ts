import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import os from 'os'
import { stripVTControlCharacters as stripAnsi } from 'util'
import minimist from 'minimist'
import type { ParsedCypressArgv } from '../../../lib/util/args'
import { toObject, normalizeBackslashes, toArray } from '../../../lib/util/args'
import * as getWindowsProxyUtil from '../../../lib/util/get-windows-proxy'

const getCwd = () => process.cwd()

describe('lib/util/args', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('minimist behavior', () => {
    it('casts numbers by default', () => {
      const options = minimist(['--ci-build-id', '1e100'])

      expect(options).toStrictEqual({
        _: [],
        'ci-build-id': 1e+100,
      })
    })

    it('does not cast strings if specified', () => {
      const options = minimist(['--ci-build-id', '1e100'], {
        string: ['ci-build-id'],
      })

      expect(options).toStrictEqual({
        _: [],
        'ci-build-id': '1e100',
      })
    })

    it('does not cast alias strings if specified', () => {
      const options = minimist(['--ciBuildId', '1e100'], {
        string: ['ci-build-id'],
        alias: {
          'ci-build-id': 'ciBuildId',
        },
      })

      expect(options).toStrictEqual({
        _: [],
        'ci-build-id': '1e100',
        ciBuildId: '1e100',
      })
    })
  })

  describe('--smoke-test', () => {
    it('sets pong to ping', () => {
      const options = toObject(['--smoke-test', '--ping=123'])

      expect(options.pong).toBe(123)
    })
  })

  describe('normalizeBackslashes', () => {
    it('sets non-string properties to undefined', () => {
      const input = {
        // string properties
        project: true,
        appPath: '/foo/bar',
        // unknown properties will be preserved
        somethingElse: 42,
      }
      const output = normalizeBackslashes(input)

      expect(output).toStrictEqual({
        appPath: '/foo/bar',
        somethingElse: 42,
      })
    })

    it('handles empty project path string', () => {
      const input = {
        project: '',
      }
      const output = normalizeBackslashes(input)

      // empty project path remains
      expect(output).toStrictEqual(input)
    })
  })

  describe('--project', () => {
    it('sets projectRoot', () => {
      const projectRoot = path.resolve(getCwd(), './foo/bar')
      const options = toObject(['--project', './foo/bar'])

      expect(options.projectRoot).toBe(projectRoot)
    })

    it('is undefined if not specified', () => {
      const options = toObject([])

      expect(options.projectRoot).toBe(undefined)
    })

    it('handles bool project parameter', () => {
      const options = toObject(['--project', true] as unknown as string[])

      expect(options.projectRoot).toBe(undefined)
    })
  })

  describe('--run-project', () => {
    it('sets projectRoot', () => {
      const projectRoot = path.resolve(getCwd(), '/baz')
      const options = toObject(['--run-project', '/baz'])

      expect(options.projectRoot).toBe(projectRoot)
    })

    it('strips single double quote from the end', () => {
      // https://github.com/cypress-io/cypress/issues/535
      // NPM does not pass correctly options that end with backslash
      const options = toObject(['--run-project', 'C:\\foo"'])

      expect(options.runProject).toBe('C:\\foo')
    })

    it('does not strip if there are multiple double quotes', () => {
      const options = toObject(['--run-project', '"foo bar"'])

      expect(options.runProject).toBe('"foo bar"')
    })
  })

  describe('--spec', () => {
    it('converts to array', () => {
      const options = toObject(['--run-project', 'foo', '--spec', 'cypress/integration/a.js,cypress/integration/b.js,cypress/integration/c.js'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/a.js`)
      expect(options.spec[1]).toBe(`${getCwd()}/cypress/integration/b.js`)

      expect(options.spec[2]).toBe(`${getCwd()}/cypress/integration/c.js`)
    })

    it('discards wrapping single quotes', () => {
      const options = toObject(['--run-project', 'foo', '--spec', '\'cypress/integration/foo_spec.js\''])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/foo_spec.js`)
    })

    it('throws if argument cannot be parsed', () => {
      expect(() => {
        return toObject(['--run-project', 'foo', '--spec', {}] as unknown as string[])
      }).toThrow()

      try {
        return toObject(['--run-project', 'foo', '--spec', {}] as unknown as string[])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid spec error')
      }
    })

    it('should be correctly parsing globs with lists & ranges', () => {
      const options = toObject(['--spec', 'cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js`)
    })

    it('should be correctly parsing globs with a mix of lists, ranges & regular paths', () => {
      const options = toObject(['--spec', 'cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js,cypress/integration/foo.spec.js'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js`)
      expect(options.spec[1]).toBe(`${getCwd()}/cypress/integration/foo.spec.js`)
    })

    it('should be correctly parsing single glob with range', () => {
      const options = toObject(['--spec', 'cypress/integration/[a-c]*/**'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/[a-c]*/**`)
    })

    it('should be correctly parsing single glob with list', () => {
      const options = toObject(['--spec', 'cypress/integration/{a,b,c}/*.js'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/{a,b,c}/*.js`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('does not split at filename with glob pattern', () => {
      const options = toObject(['--spec', 'cypress/integration/foo/bar/[baz]/test.ts,cypress/integration/foo1/bar/[baz]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/foo/bar/[baz]/test.ts`)
      expect(options.spec[1]).toBe(`${getCwd()}/cypress/integration/foo1/bar/[baz]/test.ts`)
      expect(options.spec[2]).toBe(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).toBe(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('correctly splits at comma with glob pattern', () => {
      const options = toObject(['--spec', 'cypress/integration/foo/bar/baz/test.ts,cypress/integration/foo1/bar/[baz]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/foo/bar/baz/test.ts`)
      expect(options.spec[1]).toBe(`${getCwd()}/cypress/integration/foo1/bar/[baz]/test.ts`)
      expect(options.spec[2]).toBe(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).toBe(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('correctly splits at comma with escaped glob pattern', () => {
      const options = toObject(['--spec', 'cypress/integration/foo/bar/\[baz\]/test.ts,cypress/integration/foo1/bar/\[baz1\]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts'])

      expect(options.spec[0]).toBe(`${getCwd()}/cypress/integration/foo/bar/\[baz\]/test.ts`)
      expect(options.spec[1]).toBe(`${getCwd()}/cypress/integration/foo1/bar/\[baz1\]/test.ts`)
      expect(options.spec[2]).toBe(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).toBe(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })
  })

  describe('--tag', () => {
    it('converts to array', () => {
      const options = toObject(['--run-project', 'foo', '--tag', 'nightly,production,build'])

      expect(options.tag[0]).toBe('nightly')
      expect(options.tag[1]).toBe('production')

      expect(options.tag[2]).toBe('build')
    })
  })

  describe('--auto-cancel-after-failures', () => {
    it('converts to integer', () => {
      const options = toObject(['--auto-cancel-after-failures', '4'])

      expect(options.autoCancelAfterFailures).toBe(4)
    })

    it('converts to false', () => {
      const options = toObject(['--auto-cancel-after-failures', 'false'])

      expect(options.autoCancelAfterFailures).toBe(false)
    })

    it('handles value 0', () => {
      const options = toObject(['--auto-cancel-after-failures', '0'])

      expect(options.autoCancelAfterFailures).toBe(0)
    })

    it('throws error when a string is set', () => {
      try {
        return toObject(['--auto-cancel-after-failures', 'foo'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid --auto-cancel-after-failures error')
      }
    })

    it('throws error when true is set', () => {
      try {
        return toObject(['--auto-cancel-after-failures', 'true'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid --auto-cancel-after-failures (true) error')
      }
    })

    it('throws error when a negative value is set', () => {
      try {
        return toObject(['--auto-cancel-after-failures', '-1'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid --auto-cancel-after-failures (negative value) error')
      }
    })

    it('throws error when a decimal value is set', () => {
      try {
        return toObject(['--auto-cancel-after-failures', '1.5'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid --auto-cancel-after-failures (decimal value) error')
      }
    })
  })

  describe('--port', () => {
    it('converts to Number', () => {
      const options = toObject(['--port', '8080'])

      expect(options.config.port).toBe(8080)
    })
  })

  describe('--env', () => {
    it('converts to object literal', () => {
      const options = toObject(['--env', 'foo=bar,version=0.12.1,host=localhost:8888,bar=qux='])

      expect(options.config.env).toStrictEqual({
        foo: 'bar',
        version: '0.12.1',
        host: 'localhost:8888',
        bar: 'qux=',
      })
    })

    it('throws if env string cannot be parsed', () => {
      expect(() => {
        return toObject(['--env', 'nonono'])
      }).toThrow()

      // now look at the error
      try {
        return toObject(['--env', 'nonono'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid env error')
      }
    })

    // https://github.com/cypress-io/cypress/issues/6891
    it('handles values containing exponential operators', () => {
      const options = toObject(['--env', 'foo=bar,hash=769e98018'])

      expect(options.config.env).toStrictEqual({
        foo: 'bar',
        hash: '769e98018',
      })
    })

    // https://github.com/cypress-io/cypress/issues/6810
    it('handles values that are arrays', () => {
      const options = toObject(['--env', 'foo="[bar1,bar2,bar3]"'])

      expect(options.config.env).toStrictEqual({
        foo: '[bar1|bar2|bar3]',
      })
    })
  })

  describe('--reporterOptions', () => {
    it('converts to object literal', () => {
      const reporterOpts = {
        mochaFile: 'path/to/results.xml',
        testCaseSwitchClassnameAndName: true,
        suiteTitleSeparatedBy: '.=|',
      }

      const options = toObject(['--reporterOptions', JSON.stringify(reporterOpts)])

      expect(options.config.reporterOptions).toStrictEqual(reporterOpts)
    })

    it('converts nested objects with mixed assignment usage', () => {
      const reporterOpts = {
        reporterEnabled: 'JSON, Spec',
        jsonReporterOptions: {
          toConsole: true,
        },
      }

      // as a full blown object
      let options = toObject(['--reporterOptions', JSON.stringify(reporterOpts)])

      expect(options.config.reporterOptions).toStrictEqual(reporterOpts)

      // as mixed usage
      const nestedJSON = JSON.stringify(reporterOpts.jsonReporterOptions)

      options = toObject([
        '--reporterOptions',
        `reporterEnabled=JSON,jsonReporterOptions=${nestedJSON}`,
      ])

      expect(options.config.reporterOptions).toStrictEqual({
        reporterEnabled: 'JSON',
        jsonReporterOptions: {
          toConsole: true,
        },
      })
    })

    it('throws if reporter string cannot be parsed', () => {
      expect(() => {
        return toObject(['--reporterOptions', 'abc'])
      }).toThrow()

      // now look at the error
      try {
        return toObject(['--reporterOptions', 'abc'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid reporter options error')
      }
    })
  })

  describe('--runner-ui', () => {
    it('converts to boolean', () => {
      const options = toObject(['--runner-ui', 'false'])

      expect(options.runnerUi).toBe(false)
    })

    it('is undefined if not specified', () => {
      const options = toObject([])

      expect(options.runnerUi).toBe(undefined)
    })
  })

  describe('--config', () => {
    it('converts to object literal', () => {
      const options = toObject(['--config', 'pageLoadTimeout=10000,waitForAnimations=false'])

      expect(options.config.pageLoadTimeout).toBe(10000)

      expect(options.config.waitForAnimations).toBe(false)
    })

    it('converts straight JSON stringification', () => {
      const config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false,
      }

      const options = toObject(['--config', JSON.stringify(config)])

      expect(options.config).toStrictEqual(config)
    })

    it('converts nested usage with JSON stringification', () => {
      const config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false,
        blockHosts: ['one.com', 'www.two.io'],
        hosts: {
          'foobar.com': '127.0.0.1',
        },
      }

      // as a full blown object
      let options = toObject(['--config', JSON.stringify(config)])

      expect(options.config).toStrictEqual(config)

      // as mixed usage
      const hosts = JSON.stringify(config.hosts)
      const blockHosts = JSON.stringify(config.blockHosts)

      options = toObject([
        '--config',
        [
          'pageLoadTimeout=10000',
          'waitForAnimations=false',
          `hosts=${hosts}`,
          `blockHosts=${blockHosts}`,
        ].join(','),

      ])

      expect(options.config).toStrictEqual(config)
    })

    it('allows config properties', () => {
      const options = toObject(['--config', 'foo=bar,port=1111,supportFile=path/to/support_file'])

      expect(options.config.port).toBe(1111)
      const cfg = options.config as Record<string, unknown>
      const e2e = cfg.e2e as Record<string, unknown>
      const component = cfg.component as Record<string, unknown>

      expect(e2e.supportFile).toBe('path/to/support_file')
      expect(component.supportFile).toBe('path/to/support_file')

      expect(options).not.toHaveProperty('foo')
      expect(options.config).not.toHaveProperty('supportFile')
    })

    it('overrides port in config', () => {
      let options = toObject(['--port', '2222', '--config', 'port=3333'])

      expect(options.config.port).toBe(2222)

      options = toObject(['--port', '2222'])

      expect(options.config.port).toBe(2222)
    })

    it('throws if config string cannot be parsed', () => {
      expect(() => {
        return toObject(['--config', 'xyz'])
      }).toThrow()

      // now look at the error
      try {
        return toObject(['--config', 'xyz'])
      } catch (err: unknown) {
        expect(stripAnsi((err as Error).message)).toMatchSnapshot('invalid config error')
      }
    })
  })

  describe('.toArray', () => {
    let obj: { config: { foo: string }, project: string }

    beforeEach(() => {
      obj = { config: { foo: 'bar' }, project: 'foo/bar' }
    })

    it('rejects values which have an corresponding underscore\'d key', () => {
      expect(toArray(obj)).toStrictEqual([
        `--config=${JSON.stringify({ foo: 'bar' })}`,
        '--project=foo/bar',
      ])
    })

    it('does not pick disallowed args', () => {
      const result = toArray({ doNotPick: 'forbidden' })

      expect(result).toHaveLength(0)
    })

    it('does pick allowed args', () => {
      const result = toArray({
        apiKey: 'apiKey',
        appPath: 'appPath',
        browser: 'browser',
        ci: 'ci',
        ciBuildId: 'ciBuildId',
        userNodePath: 'userNodePath',
        userNodeVersion: 'userNodeVersion',
        config: 'config',
        configFile: 'configFile',
        cwd: 'cwd',
        emitWhenReady: true,
        env: 'env',
        execPath: 'execPath',
        exit: 'exit',
        exitWithCode: 'exitWithCode',
        group: 'group',
        headed: 'headed',
        inspectBrk: 'inspectBrk',
        key: 'key',
        mode: 'mode',
        outputPath: 'outputPath',
        parallel: 'parallel',
        ping: 'ping',
        port: 'port',
        project: 'project',
        proxySource: 'proxySource',
        quiet: 'quiet',
        record: 'record',
        reporter: 'reporter',
        reporterOptions: 'reporterOptions',
        returnPkg: 'returnPkg',
        runMode: 'runMode',
        runProject: 'runProject',
        smokeTest: 'smokeTest',
        spec: 'spec',
        tag: 'tag',
        testingType: 'testingType',
        updating: 'updating',
        version: 'version',
      })

      expect(result).toStrictEqual([
        '--apiKey=apiKey',
        '--appPath=appPath',
        '--browser=browser',
        '--ci=ci',
        '--ciBuildId=ciBuildId',
        '--config=config',
        '--configFile=configFile',
        '--cwd=cwd',
        '--emitWhenReady=true',
        '--env=env',
        '--execPath=execPath',
        '--exit=exit',
        '--exitWithCode=exitWithCode',
        '--group=group',
        '--headed=headed',
        '--inspectBrk=inspectBrk',
        '--key=key',
        '--mode=mode',
        '--outputPath=outputPath',
        '--parallel=parallel',
        '--ping=ping',
        '--port=port',
        '--project=project',
        '--proxySource=proxySource',
        '--quiet=quiet',
        '--record=record',
        '--reporter=reporter',
        '--reporterOptions=reporterOptions',
        '--returnPkg=returnPkg',
        '--runMode=runMode',
        '--runProject=runProject',
        '--smokeTest=smokeTest',
        '--spec=spec',
        '--tag=tag',
        '--testingType=testingType',
        '--updating=updating',
        '--userNodePath=userNodePath',
        '--userNodeVersion=userNodeVersion',
        '--version=version',
      ])
    })
  })

  describe('.toObject', () => {
    let hosts: { a: string, b: string }
    let blockHosts: string[]
    let specs: string[]
    let env: { foo: string, baz: string, bar: string }
    let config: Record<string, unknown>
    let obj: ParsedCypressArgv

    beforeEach(() => {
      hosts = { a: 'b', b: 'c' }
      blockHosts = ['a.com', 'b.com']
      specs = [
        path.join(getCwd(), 'foo'),
        path.join(getCwd(), 'bar'),
        path.join(getCwd(), 'baz'),
      ]

      env = {
        foo: 'bar',
        baz: 'quux',
        bar: 'foo=quz',
      }

      config = {
        env,
        hosts,
        requestTimeout: 1234,
        blockHosts,
        reporterOptions: {
          foo: 'bar',
        },
      }

      const s = (str: unknown) => {
        return JSON.stringify(str)
      }

      obj = toObject([
        '--env=foo=bar,baz=quux,bar=foo=quz',
        '--config',
        `requestTimeout=1234,blockHosts=${s(blockHosts)},hosts=${s(hosts)}`,
        '--reporter-options=foo=bar',
        '--spec=foo,bar,baz',
      ])
    })

    it('coerces booleans', () => {
      expect(toObject(['--foo=true']).foo).toBe(true)
      expect(toObject(['--no-record']).record).toBe(false)

      expect(toObject(['--record=false']).record).toBe(false)
    })

    it('parses --emit-when-ready', () => {
      expect(toObject(['--emit-when-ready']).emitWhenReady).toBe(true)
    })

    it('backs up env, config, reporterOptions, spec', () => {
      expect(obj).toStrictEqual({
        cwd: getCwd(),
        _: [],
        config,
        invokedFromCli: false,
        spec: specs,
      })
    })

    it('can transpose back to an array', () => {
      const mergedConfig = JSON.stringify({
        requestTimeout: config.requestTimeout,
        blockHosts,
        hosts,
        env,
        reporterOptions: {
          foo: 'bar',
        },
      })

      const args = toArray(obj)

      expect(args).toStrictEqual([
        `--config=${mergedConfig}`,
        `--cwd=${getCwd()}`,
        `--spec=${JSON.stringify(specs)}`,
      ])

      expect(toObject(args)).toStrictEqual({
        cwd: getCwd(),
        _: [],
        invokedFromCli: true,
        config,
        spec: specs,
      })
    })

    it('does not coerce --ci-build-id', () => {
      const result = toObject(['--ci-build-id', '1e100'])

      expect(result).toStrictEqual({
        ciBuildId: '1e100',
        cwd: getCwd(),
        _: [],
        invokedFromCli: false,
        config: {},
      })
    })

    it('moves testing-type specific config options', () => {
      const result = toObject(['--config', '{"baseUrl": "http://foobar.com", "specPattern":"**/*.test.js"}'])

      expect(result).toStrictEqual({
        cwd: getCwd(),
        _: [],
        invokedFromCli: false,
        config: {
          e2e: { baseUrl: 'http://foobar.com', specPattern: '**/*.test.js' },
          component: { specPattern: '**/*.test.js' },
        },
      })
    })
  })

  describe('--updating', () => {
    // updating from 0.13.9 will omit the appPath + execPath so we must
    // handle these missing arguments manually
    it('slurps up appPath + execPath if updating and these are omitted', () => {
      const argv = [
        '/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress',
        '/Applications/Cypress.app',
        '/Applications/Cypress.app',
        '--updating',
      ]

      expect(toObject(argv)).toStrictEqual({
        cwd: getCwd(),
        _: [
          '/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress',
          '/Applications/Cypress.app',
          '/Applications/Cypress.app',
        ],
        config: {},
        appPath: '/Applications/Cypress.app',
        execPath: '/Applications/Cypress.app',
        invokedFromCli: false,
        updating: true,
      })
    })

    it('does not slurp up appPath + execPath if updating and these are already present in args', () => {
      const argv = [
        '/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress',
        '/Applications/Cypress.app1',
        '/Applications/Cypress.app2',
        '--app-path=a',
        '--exec-path=e',
        '--updating',
      ]

      expect(toObject(argv)).toStrictEqual({
        cwd: getCwd(),
        _: [
          '/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress',
          '/Applications/Cypress.app1',
          '/Applications/Cypress.app2',
        ],
        config: {},
        appPath: 'a',
        execPath: 'e',
        invokedFromCli: false,
        updating: true,
      })
    })
  })

  describe('with proxy', () => {
    beforeEach(() => {
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      delete process.env.NO_PROXY
      delete process.env.http_proxy
      delete process.env.https_proxy

      return delete process.env.no_proxy
    })

    it('sets options from environment', () => {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = 'a,b,c'
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyServer).toBe('http://foo-bar.baz:123')
      expect(options.proxyBypassList).toBe('a,b,c,127.0.0.1,::1,localhost')

      expect(process.env.HTTPS_PROXY).toBe(process.env.HTTP_PROXY)
    })

    it('loads from Windows registry if not defined', () => {
      vi.spyOn(getWindowsProxyUtil, 'getWindowsProxy').mockReturnValue({
        httpProxy: 'http://quux.quuz',
        noProxy: 'd,e,f',
      })

      vi.spyOn(os, 'platform').mockReturnValue('win32')
      const options = toObject([])

      expect(options.proxySource).toBe('win32')
      expect(options.proxyServer).toBe('http://quux.quuz')
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyServer).toBe(process.env.HTTPS_PROXY)
      expect(options.proxyBypassList).toBe('d,e,f,127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    });

    ['', 'false', '0'].forEach((override) => {
      it(`doesn't load from Windows registry if HTTP_PROXY overridden with string '${override}'`, () => {
        vi.spyOn(getWindowsProxyUtil, 'getWindowsProxy').mockReturnValue(undefined)
        vi.spyOn(os, 'platform').mockReturnValue('win32')
        process.env.HTTP_PROXY = override
        const options = toObject([])

        expect(getWindowsProxyUtil.getWindowsProxy).not.toHaveBeenCalled()
        expect(options.proxySource).toBeUndefined()
        expect(options.proxyServer).toBeUndefined()
        expect(options.proxyBypassList).toBeUndefined()
        expect(process.env.HTTP_PROXY).toBeUndefined()
        expect(process.env.HTTPS_PROXY).toBeUndefined()

        expect(process.env.NO_PROXY).toBe('127.0.0.1,::1,localhost')
      })
    })

    it(`doesn't mess with env vars if Windows registry doesn't have proxy`, () => {
      vi.spyOn(getWindowsProxyUtil, 'getWindowsProxy').mockReturnValue(undefined)
      vi.spyOn(os, 'platform').mockReturnValue('win32')
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBeUndefined()
      expect(options.proxyBypassList).toBeUndefined()
      expect(process.env.HTTP_PROXY).toBeUndefined()
      expect(process.env.HTTPS_PROXY).toBeUndefined()

      expect(process.env.NO_PROXY).toBe('127.0.0.1,::1,localhost')
    })

    it('sets a default NO_PROXY', () => {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).toBe('127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('does not add localhost to NO_PROXY if NO_PROXY contains <-loopback>', () => {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = 'a,b,c,<-loopback>,d'
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).toBe('a,b,c,<-loopback>,d')

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('sets a default localhost NO_PROXY if NO_PROXY = \'\'', () => {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = ''
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).toBe('127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('does not set a default localhost NO_PROXY if NO_PROXY = \'<-loopback>\'', () => {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = '<-loopback>'
      const options = toObject([])

      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).toBe('<-loopback>')

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('copies lowercase proxy vars to uppercase', () => {
      process.env.http_proxy = 'http://foo-bar.baz:123'
      process.env.https_proxy = 'https://foo-bar.baz:123'
      process.env.no_proxy = 'http://no-proxy.holla'
      expect(process.env.HTTP_PROXY).toBeUndefined()
      expect(process.env.HTTPS_PROXY).toBeUndefined()
      expect(process.env.NO_PROXY).toBeUndefined()

      const options = toObject([])

      expect(process.env.HTTP_PROXY).toBe('http://foo-bar.baz:123')
      expect(process.env.HTTPS_PROXY).toBe('https://foo-bar.baz:123')
      expect(process.env.NO_PROXY).toBe('http://no-proxy.holla,127.0.0.1,::1,localhost')
      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('can use npm_config_proxy', () => {
      process.env.npm_config_proxy = 'http://foo-bar.baz:123'
      expect(process.env.HTTP_PROXY).toBeUndefined()

      const options = toObject([])

      expect(process.env.HTTP_PROXY).toBe('http://foo-bar.baz:123')
      expect(process.env.HTTPS_PROXY).toBe('http://foo-bar.baz:123')
      expect(process.env.NO_PROXY).toBe('127.0.0.1,::1,localhost')
      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).toBe(process.env.NO_PROXY)
    })

    it('can override npm_config_proxy with falsy HTTP_PROXY', () => {
      process.env.npm_config_proxy = 'http://foo-bar.baz:123'
      process.env.HTTP_PROXY = ''

      const options = toObject([])

      expect(process.env.HTTP_PROXY).toBeUndefined()
      expect(process.env.HTTPS_PROXY).toBeUndefined()
      expect(process.env.NO_PROXY).toBe('127.0.0.1,::1,localhost')
      expect(options.proxySource).toBeUndefined()
      expect(options.proxyServer).toBe(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).toBeUndefined()
    })
  })
})
