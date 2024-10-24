require('../../spec_helper')

const path = require('path')
const os = require('os')
const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')
const minimist = require('minimist')
const argsUtil = require(`../../../lib/util/args`)
const getWindowsProxyUtil = require(`../../../lib/util/get-windows-proxy`)

const getCwd = () => process.cwd()

describe('lib/util/args', () => {
  beforeEach(function () {
    this.setup = (...args) => {
      return argsUtil.toObject(args)
    }
  })

  context('minimist behavior', () => {
    it('casts numbers by default', () => {
      const options = minimist(['--ci-build-id', '1e100'])

      expect(options).to.deep.equal({
        _: [],
        'ci-build-id': 1e+100,
      })
    })

    it('does not cast strings if specified', () => {
      const options = minimist(['--ci-build-id', '1e100'], {
        string: ['ci-build-id'],
      })

      expect(options).to.deep.equal({
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

      expect(options).to.deep.equal({
        _: [],
        'ci-build-id': '1e100',
        ciBuildId: '1e100',
      })
    })
  })

  context('--smoke-test', () => {
    it('sets pong to ping', function () {
      const options = this.setup('--smoke-test', '--ping=123')

      expect(options.pong).to.eq(123)
    })
  })

  context('normalizeBackslashes', () => {
    it('sets non-string properties to undefined', () => {
      const input = {
        // string properties
        project: true,
        appPath: '/foo/bar',
        // unknown properties will be preserved
        somethingElse: 42,
      }
      const output = argsUtil.normalizeBackslashes(input)

      expect(output).to.deep.equal({
        appPath: '/foo/bar',
        somethingElse: 42,
      })
    })

    it('handles empty project path string', () => {
      const input = {
        project: '',
      }
      const output = argsUtil.normalizeBackslashes(input)

      // empty project path remains
      expect(output).to.deep.equal(input)
    })
  })

  context('--project', () => {
    it('sets projectRoot', function () {
      const projectRoot = path.resolve(getCwd(), './foo/bar')
      const options = this.setup('--project', './foo/bar')

      expect(options.projectRoot).to.eq(projectRoot)
    })

    it('is undefined if not specified', function () {
      const options = this.setup()

      expect(options.projectRoot).to.eq(undefined)
    })

    it('handles bool project parameter', function () {
      const options = this.setup('--project', true)

      expect(options.projectRoot).to.eq(undefined)
    })
  })

  context('--run-project', () => {
    it('sets projectRoot', function () {
      const projectRoot = path.resolve(getCwd(), '/baz')
      const options = this.setup('--run-project', '/baz')

      expect(options.projectRoot).to.eq(projectRoot)
    })

    it('strips single double quote from the end', function () {
      // https://github.com/cypress-io/cypress/issues/535
      // NPM does not pass correctly options that end with backslash
      const options = this.setup('--run-project', 'C:\\foo"')

      expect(options.runProject).to.eq('C:\\foo')
    })

    it('does not strip if there are multiple double quotes', function () {
      const options = this.setup('--run-project', '"foo bar"')

      expect(options.runProject).to.eq('"foo bar"')
    })
  })

  context('--spec', () => {
    it('converts to array', function () {
      const options = this.setup('--run-project', 'foo', '--spec', 'cypress/integration/a.js,cypress/integration/b.js,cypress/integration/c.js')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/a.js`)
      expect(options.spec[1]).to.eq(`${getCwd()}/cypress/integration/b.js`)

      expect(options.spec[2]).to.eq(`${getCwd()}/cypress/integration/c.js`)
    })

    it('discards wrapping single quotes', function () {
      const options = this.setup('--run-project', 'foo', '--spec', '\'cypress/integration/foo_spec.js\'')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/foo_spec.js`)
    })

    it('throws if argument cannot be parsed', function () {
      expect(() => {
        return this.setup('--run-project', 'foo', '--spec', {})
      }).to.throw

      try {
        return this.setup('--run-project', 'foo', '--spec', {})
      } catch (err) {
        return snapshot('invalid spec error', stripAnsi(err.message))
      }
    })

    it('should be correctly parsing globs with lists & ranges', function () {
      const options = this.setup('--spec', 'cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js`)
    })

    it('should be correctly parsing globs with a mix of lists, ranges & regular paths', function () {
      const options = this.setup('--spec', 'cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js,cypress/integration/foo.spec.js')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/{[!a]*.spec.js,sub1,{sub2,sub3/sub4}}/*.js`)
      expect(options.spec[1]).to.eq(`${getCwd()}/cypress/integration/foo.spec.js`)
    })

    it('should be correctly parsing single glob with range', function () {
      const options = this.setup('--spec', 'cypress/integration/[a-c]*/**')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/[a-c]*/**`)
    })

    it('should be correctly parsing single glob with list', function () {
      const options = this.setup('--spec', 'cypress/integration/{a,b,c}/*.js')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/{a,b,c}/*.js`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('does not split at filename with glob pattern', function () {
      const options = this.setup('--spec', 'cypress/integration/foo/bar/[baz]/test.ts,cypress/integration/foo1/bar/[baz]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/foo/bar/[baz]/test.ts`)
      expect(options.spec[1]).to.eq(`${getCwd()}/cypress/integration/foo1/bar/[baz]/test.ts`)
      expect(options.spec[2]).to.eq(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).to.eq(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('correctly splits at comma with glob pattern', function () {
      const options = this.setup('--spec', 'cypress/integration/foo/bar/baz/test.ts,cypress/integration/foo1/bar/[baz]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/foo/bar/baz/test.ts`)
      expect(options.spec[1]).to.eq(`${getCwd()}/cypress/integration/foo1/bar/[baz]/test.ts`)
      expect(options.spec[2]).to.eq(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).to.eq(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })

    // https://github.com/cypress-io/cypress/issues/20794
    it('correctly splits at comma with escaped glob pattern', function () {
      const options = this.setup('--spec', 'cypress/integration/foo/bar/\[baz\]/test.ts,cypress/integration/foo1/bar/\[baz1\]/test.ts,cypress/integration/foo2/bar/baz/test.ts,cypress/integration/foo3/bar/baz/foo4.ts')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/foo/bar/\[baz\]/test.ts`)
      expect(options.spec[1]).to.eq(`${getCwd()}/cypress/integration/foo1/bar/\[baz1\]/test.ts`)
      expect(options.spec[2]).to.eq(`${getCwd()}/cypress/integration/foo2/bar/baz/test.ts`)
      expect(options.spec[3]).to.eq(`${getCwd()}/cypress/integration/foo3/bar/baz/foo4.ts`)
    })

    // https://github.com/cypress-io/cypress/issues/28509
    it('correctly escapes parentheses in filename', function () {
      const options = this.setup('--spec', 'cypress/integration/foo/bar/test().ts')

      expect(options.spec[0]).to.eq(`${getCwd()}/cypress/integration/foo/bar/test\\(\\).ts`)
    })
  })

  context('--tag', () => {
    it('converts to array', function () {
      const options = this.setup('--run-project', 'foo', '--tag', 'nightly,production,build')

      expect(options.tag[0]).to.eq('nightly')
      expect(options.tag[1]).to.eq('production')

      expect(options.tag[2]).to.eq('build')
    })
  })

  context('--auto-cancel-after-failures', () => {
    it('converts to integer', function () {
      const options = this.setup('--auto-cancel-after-failures', '4')

      expect(options.autoCancelAfterFailures).to.eq(4)
    })

    it('converts to false', function () {
      const options = this.setup('--auto-cancel-after-failures', 'false')

      expect(options.autoCancelAfterFailures).to.eq(false)
    })

    it('handles value 0', function () {
      const options = this.setup('--auto-cancel-after-failures', '0')

      expect(options.autoCancelAfterFailures).to.eq(0)
    })

    it('throws error when a string is set', function () {
      try {
        return this.setup('--auto-cancel-after-failures', 'foo')
      } catch (err) {
        return snapshot('invalid --auto-cancel-after-failures error', stripAnsi(err.message))
      }
    })

    it('throws error when true is set', function () {
      try {
        return this.setup('--auto-cancel-after-failures', 'true')
      } catch (err) {
        return snapshot('invalid --auto-cancel-after-failures (true) error', stripAnsi(err.message))
      }
    })

    it('throws error when a negative value is set', function () {
      try {
        return this.setup('--auto-cancel-after-failures', '-1')
      } catch (err) {
        return snapshot('invalid --auto-cancel-after-failures (negative value) error', stripAnsi(err.message))
      }
    })

    it('throws error when a decimal value is set', function () {
      try {
        return this.setup('--auto-cancel-after-failures', '1.5')
      } catch (err) {
        return snapshot('invalid --auto-cancel-after-failures (decimal value) error', stripAnsi(err.message))
      }
    })
  })

  context('--port', () => {
    it('converts to Number', function () {
      const options = this.setup('--port', '8080')

      expect(options.config.port).to.eq(8080)
    })
  })

  context('--env', () => {
    it('converts to object literal', function () {
      const options = this.setup('--env', 'foo=bar,version=0.12.1,host=localhost:8888,bar=qux=')

      expect(options.config.env).to.deep.eq({
        foo: 'bar',
        version: '0.12.1',
        host: 'localhost:8888',
        bar: 'qux=',
      })
    })

    it('throws if env string cannot be parsed', function () {
      expect(() => {
        return this.setup('--env', 'nonono')
      }).to.throw

      // now look at the error
      try {
        return this.setup('--env', 'nonono')
      } catch (err) {
        return snapshot('invalid env error', stripAnsi(err.message))
      }
    })

    // https://github.com/cypress-io/cypress/issues/6891
    it('handles values containing exponential operators', function () {
      const options = this.setup('--env', 'foo=bar,hash=769e98018')

      expect(options.config.env).to.deep.eq({
        foo: 'bar',
        hash: '769e98018',
      })
    })

    // https://github.com/cypress-io/cypress/issues/6810
    it('handles values that are arrays', function () {
      const options = this.setup('--env', 'foo="[bar1,bar2,bar3]"')

      expect(options.config.env).to.deep.eq({
        foo: '[bar1|bar2|bar3]',
      })
    })
  })

  context('--reporterOptions', () => {
    it('converts to object literal', function () {
      const reporterOpts = {
        mochaFile: 'path/to/results.xml',
        testCaseSwitchClassnameAndName: true,
        suiteTitleSeparatedBy: '.=|',
      }

      const options = this.setup('--reporterOptions', JSON.stringify(reporterOpts))

      expect(options.config.reporterOptions).to.deep.eq(reporterOpts)
    })

    it('converts nested objects with mixed assignment usage', function () {
      const reporterOpts = {
        reporterEnabled: 'JSON, Spec',
        jsonReporterOptions: {
          toConsole: true,
        },
      }

      // as a full blown object
      let options = this.setup('--reporterOptions', JSON.stringify(reporterOpts))

      expect(options.config.reporterOptions).to.deep.eq(reporterOpts)

      // as mixed usage
      const nestedJSON = JSON.stringify(reporterOpts.jsonReporterOptions)

      options = this.setup(
        '--reporterOptions',
        `reporterEnabled=JSON,jsonReporterOptions=${nestedJSON}`,
      )

      expect(options.config.reporterOptions).to.deep.eq({
        reporterEnabled: 'JSON',
        jsonReporterOptions: {
          toConsole: true,
        },
      })
    })

    it('throws if reporter string cannot be parsed', function () {
      expect(() => {
        return this.setup('--reporterOptions', 'abc')
      }).to.throw

      // now look at the error
      try {
        return this.setup('--reporterOptions', 'abc')
      } catch (err) {
        return snapshot('invalid reporter options error', stripAnsi(err.message))
      }
    })
  })

  context('--runner-ui', () => {
    it('converts to boolean', function () {
      const options = this.setup('--runner-ui', 'false')

      expect(options.runnerUi).to.eq(false)
    })

    it('is undefined if not specified', function () {
      const options = this.setup()

      expect(options.runnerUi).to.eq(undefined)
    })
  })

  context('--config', () => {
    it('converts to object literal', function () {
      const options = this.setup('--config', 'pageLoadTimeout=10000,waitForAnimations=false')

      expect(options.config.pageLoadTimeout).eq(10000)

      expect(options.config.waitForAnimations).eq(false)
    })

    it('converts straight JSON stringification', function () {
      const config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false,
      }

      const options = this.setup('--config', JSON.stringify(config))

      expect(options.config).to.deep.eq(config)
    })

    it('converts nested usage with JSON stringification', function () {
      const config = {
        pageLoadTimeout: 10000,
        waitForAnimations: false,
        blockHosts: ['one.com', 'www.two.io'],
        hosts: {
          'foobar.com': '127.0.0.1',
        },
      }

      // as a full blown object
      let options = this.setup('--config', JSON.stringify(config))

      expect(options.config).to.deep.eq(config)

      // as mixed usage
      const hosts = JSON.stringify(config.hosts)
      const blockHosts = JSON.stringify(config.blockHosts)

      options = this.setup(
        '--config',
        [
          'pageLoadTimeout=10000',
          'waitForAnimations=false',
          `hosts=${hosts}`,
          `blockHosts=${blockHosts}`,
        ].join(','),

      )

      expect(options.config).to.deep.eq(config)
    })

    it('allows config properties', function () {
      const options = this.setup('--config', 'foo=bar,port=1111,supportFile=path/to/support_file')

      expect(options.config.port).to.eq(1111)
      expect(options.config.e2e.supportFile).to.eq('path/to/support_file')
      expect(options.config.component.supportFile).to.eq('path/to/support_file')

      expect(options).not.to.have.property('foo')
      expect(options.config).not.to.have.property('supportFile')
    })

    it('overrides port in config', function () {
      let options = this.setup('--port', 2222, '--config', 'port=3333')

      expect(options.config.port).to.eq(2222)

      options = this.setup('--port', 2222)

      expect(options.config.port).to.eq(2222)
    })

    it('throws if config string cannot be parsed', function () {
      expect(() => {
        return this.setup('--config', 'xyz')
      }).to.throw

      // now look at the error
      try {
        return this.setup('--config', 'xyz')
      } catch (err) {
        return snapshot('invalid config error', stripAnsi(err.message))
      }
    })
  })

  context('.toArray', () => {
    beforeEach(function () {
      this.obj = { config: { foo: 'bar' }, project: 'foo/bar' }
    })

    it('rejects values which have an corresponding underscore\'d key', function () {
      expect(argsUtil.toArray(this.obj)).to.deep.eq([
        `--config=${JSON.stringify({ foo: 'bar' })}`,
        '--project=foo/bar',
      ])
    })

    it('does not pick disallowed args', () => {
      const result = argsUtil.toArray({ doNotPick: 'forbidden' })

      expect(result).to.be.empty
    })

    it('does pick allowed args', () => {
      const result = argsUtil.toArray({
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

      expect(result).to.deep.eq([
        '--apiKey=apiKey',
        '--appPath=appPath',
        '--browser=browser',
        '--ci=ci',
        '--ciBuildId=ciBuildId',
        '--config=config',
        '--configFile=configFile',
        '--cwd=cwd',
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

  context('.toObject', () => {
    beforeEach(function () {
      this.hosts = { a: 'b', b: 'c' }
      this.blockHosts = ['a.com', 'b.com']
      this.specs = [
        path.join(getCwd(), 'foo'),
        path.join(getCwd(), 'bar'),
        path.join(getCwd(), 'baz'),
      ]

      this.env = {
        foo: 'bar',
        baz: 'quux',
        bar: 'foo=quz',
      }

      this.config = {
        env: this.env,
        hosts: this.hosts,
        requestTimeout: 1234,
        blockHosts: this.blockHosts,
        reporterOptions: {
          foo: 'bar',
        },
      }

      const s = (str) => {
        return JSON.stringify(str)
      }

      this.obj = this.setup(
        '--env=foo=bar,baz=quux,bar=foo=quz',
        '--config',
        `requestTimeout=1234,blockHosts=${s(this.blockHosts)},hosts=${s(this.hosts)}`,
        '--reporter-options=foo=bar',
        '--spec=foo,bar,baz',
      )
    })

    it('coerces booleans', function () {
      expect(this.setup('--foo=true').foo).be.true
      expect(this.setup('--no-record').record).to.be.false

      expect(this.setup('--record=false').record).to.be.false
    })

    it('backs up env, config, reporterOptions, spec', function () {
      expect(this.obj).to.deep.eq({
        cwd: getCwd(),
        _: [],
        config: this.config,
        invokedFromCli: false,
        spec: this.specs,
      })
    })

    it('can transpose back to an array', function () {
      const mergedConfig = JSON.stringify({
        requestTimeout: this.config.requestTimeout,
        blockHosts: this.blockHosts,
        hosts: this.hosts,
        env: this.env,
        reporterOptions: {
          foo: 'bar',
        },
      })

      const args = argsUtil.toArray(this.obj)

      expect(args).to.deep.eq([
        `--config=${mergedConfig}`,
        `--cwd=${getCwd()}`,
        `--spec=${JSON.stringify(this.specs)}`,
      ])

      expect(argsUtil.toObject(args)).to.deep.eq({
        cwd: getCwd(),
        _: [],
        invokedFromCli: true,
        config: this.config,
        spec: this.specs,
      })
    })

    it('does not coerce --ci-build-id', function () {
      const result = argsUtil.toObject(['--ci-build-id', '1e100'])

      expect(result).to.deep.equal({
        ciBuildId: '1e100',
        cwd: getCwd(),
        _: [],
        invokedFromCli: false,
        config: {},
      })
    })

    it('moves testing-type specific config options', function () {
      const result = argsUtil.toObject(['--config', '{"baseUrl": "http://foobar.com", "specPattern":"**/*.test.js"}'])

      expect(result).to.deep.equal({
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

  context('--updating', () => {
    // updating from 0.13.9 will omit the appPath + execPath so we must
    // handle these missing arguments manually
    it('slurps up appPath + execPath if updating and these are omitted', () => {
      const argv = [
        '/private/var/folders/wr/3xdzqnq16lz5r1j_xtl443580000gn/T/cypress/Cypress.app/Contents/MacOS/Cypress',
        '/Applications/Cypress.app',
        '/Applications/Cypress.app',
        '--updating',
      ]

      expect(argsUtil.toObject(argv)).to.deep.eq({
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

      expect(argsUtil.toObject(argv)).to.deep.eq({
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

  context('with proxy', () => {
    beforeEach(function () {
      process.env = this.originalEnv
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      delete process.env.NO_PROXY
      delete process.env.http_proxy
      delete process.env.https_proxy

      return delete process.env.no_proxy
    })

    it('sets options from environment', function () {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = 'a,b,c'
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyServer).to.eq('http://foo-bar.baz:123')
      expect(options.proxyBypassList).to.eq('a,b,c,127.0.0.1,::1,localhost')

      expect(process.env.HTTPS_PROXY).to.eq(process.env.HTTP_PROXY)
    })

    it('loads from Windows registry if not defined', function () {
      sinon.stub(getWindowsProxyUtil, 'getWindowsProxy').returns({
        httpProxy: 'http://quux.quuz',
        noProxy: 'd,e,f',
      })

      sinon.stub(os, 'platform').returns('win32')
      const options = this.setup()

      expect(options.proxySource).to.eq('win32')
      expect(options.proxyServer).to.eq('http://quux.quuz')
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyServer).to.eq(process.env.HTTPS_PROXY)
      expect(options.proxyBypassList).to.eq('d,e,f,127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    });

    ['', 'false', '0'].forEach((override) => {
      it(`doesn't load from Windows registry if HTTP_PROXY overridden with string '${override}'`, function () {
        sinon.stub(getWindowsProxyUtil, 'getWindowsProxy').returns()
        sinon.stub(os, 'platform').returns('win32')
        process.env.HTTP_PROXY = override
        const options = this.setup()

        expect(getWindowsProxyUtil.getWindowsProxy).to.not.called
        expect(options.proxySource).to.be.undefined
        expect(options.proxyServer).to.be.undefined
        expect(options.proxyBypassList).to.be.undefined
        expect(process.env.HTTP_PROXY).to.be.undefined
        expect(process.env.HTTPS_PROXY).to.be.undefined

        expect(process.env.NO_PROXY).to.eq('127.0.0.1,::1,localhost')
      })
    })

    it(`doesn't mess with env vars if Windows registry doesn't have proxy`, function () {
      sinon.stub(getWindowsProxyUtil, 'getWindowsProxy').returns()
      sinon.stub(os, 'platform').returns('win32')
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.be.undefined
      expect(options.proxyBypassList).to.be.undefined
      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined

      expect(process.env.NO_PROXY).to.eq('127.0.0.1,::1,localhost')
    })

    it('sets a default NO_PROXY', function () {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).to.eq('127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('does not add localhost to NO_PROXY if NO_PROXY contains <-loopback>', function () {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = 'a,b,c,<-loopback>,d'
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).to.eq('a,b,c,<-loopback>,d')

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('sets a default localhost NO_PROXY if NO_PROXY = \'\'', function () {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = ''
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).to.eq('127.0.0.1,::1,localhost')

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('does not set a default localhost NO_PROXY if NO_PROXY = \'<-loopback>\'', function () {
      process.env.HTTP_PROXY = 'http://foo-bar.baz:123'
      process.env.NO_PROXY = '<-loopback>'
      const options = this.setup()

      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)
      expect(options.proxyBypassList).to.eq('<-loopback>')

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('copies lowercase proxy vars to uppercase', function () {
      process.env.http_proxy = 'http://foo-bar.baz:123'
      process.env.https_proxy = 'https://foo-bar.baz:123'
      process.env.no_proxy = 'http://no-proxy.holla'
      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined
      expect(process.env.NO_PROXY).to.be.undefined

      const options = this.setup()

      expect(process.env.HTTP_PROXY).to.eq('http://foo-bar.baz:123')
      expect(process.env.HTTPS_PROXY).to.eq('https://foo-bar.baz:123')
      expect(process.env.NO_PROXY).to.eq('http://no-proxy.holla,127.0.0.1,::1,localhost')
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('can use npm_config_proxy', function () {
      process.env.npm_config_proxy = 'http://foo-bar.baz:123'
      expect(process.env.HTTP_PROXY).to.be.undefined

      const options = this.setup()

      expect(process.env.HTTP_PROXY).to.eq('http://foo-bar.baz:123')
      expect(process.env.HTTPS_PROXY).to.eq('http://foo-bar.baz:123')
      expect(process.env.NO_PROXY).to.eq('127.0.0.1,::1,localhost')
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).to.eq(process.env.NO_PROXY)
    })

    it('can override npm_config_proxy with falsy HTTP_PROXY', function () {
      process.env.npm_config_proxy = 'http://foo-bar.baz:123'
      process.env.HTTP_PROXY = ''

      const options = this.setup()

      expect(process.env.HTTP_PROXY).to.be.undefined
      expect(process.env.HTTPS_PROXY).to.be.undefined
      expect(process.env.NO_PROXY).to.eq('127.0.0.1,::1,localhost')
      expect(options.proxySource).to.be.undefined
      expect(options.proxyServer).to.eq(process.env.HTTP_PROXY)

      expect(options.proxyBypassList).to.be.undefined
    })
  })
})
