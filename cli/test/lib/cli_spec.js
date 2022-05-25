require('../spec_helper')

const os = require('os')
const cli = require(`${lib}/cli`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const info = require(`${lib}/exec/info`)
const run = require(`${lib}/exec/run`)
const open = require(`${lib}/exec/open`)
const cache = require(`${lib}/tasks/cache`)
const state = require(`${lib}/tasks/state`)
const verify = require(`${lib}/tasks/verify`)
const install = require(`${lib}/tasks/install`)
const spawn = require(`${lib}/exec/spawn`)
const snapshot = require('../support/snapshot')
const debug = require('debug')('test')
const execa = require('execa-wrap')
const mockedEnv = require('mocked-env')
const { expect } = require('chai')

describe('cli', () => {
  require('mocha-banner').register()

  beforeEach(() => {
    logger.reset()
    sinon.stub(process, 'exit')

    os.platform.returns('darwin')
    // sinon.stub(util, 'exit')
    sinon.stub(util, 'logErrorExit1')
    sinon.stub(util, 'pkgBuildInfo').returns({ stable: true })
    this.exec = (args) => {
      const cliArgs = `node test ${args}`.split(' ')

      debug('calling cli.init with: %o', cliArgs)

      return cli.init(cliArgs)
    }
  })

  context('unknown option', () => {
    // note it shows help for that specific command
    it('shows help', () => {
      return execa('bin/cypress', ['open', '--foo']).then((result) => {
        snapshot('shows help for open --foo 1', result)
      })
    })

    it('shows help for run command', () => {
      return execa('bin/cypress', ['run', '--foo']).then((result) => {
        snapshot('shows help for run --foo 1', result)
      })
    })

    it('shows help for cache command - unknown option --foo', () => {
      return execa('bin/cypress', ['cache', '--foo']).then(snapshot)
    })

    it('shows help for cache command - unknown sub-command foo', () => {
      return execa('bin/cypress', ['cache', 'foo']).then(snapshot)
    })

    it('shows help for cache command - no sub-command', () => {
      return execa('bin/cypress', ['cache']).then(snapshot)
    })
  })

  context('help command', () => {
    it('shows help', () => {
      return execa('bin/cypress', ['help']).then(snapshot)
    })

    it('shows help for -h', () => {
      return execa('bin/cypress', ['-h']).then(snapshot)
    })

    it('shows help for --help', () => {
      return execa('bin/cypress', ['--help']).then(snapshot)
    })
  })

  context('unknown command', () => {
    it('shows usage and exits', () => {
      return execa('bin/cypress', ['foo']).then(snapshot)
    })
  })

  context('CYPRESS_INTERNAL_ENV', () => {
    /**
     * Replaces line "Platform: ..." with "Platform: xxx"
     * @param {string} s
     */
    const replacePlatform = (s) => {
      return s.replace(/Platform: .+/, 'Platform: xxx')
    }

    /**
     * Replaces line "Cypress Version: ..." with "Cypress Version: 1.2.3"
     * @param {string} s
     */
    const replaceCypressVersion = (s) => {
      return s.replace(/Cypress Version: .+/, 'Cypress Version: 1.2.3')
    }

    const sanitizePlatform = (text) => {
      return text
      .split(os.eol)
      .map(replacePlatform)
      .map(replaceCypressVersion)
      .join(os.eol)
    }

    it('allows and warns when staging environment', () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'staging',
        },
        filter: ['code', 'stderr', 'stdout'],
      }

      return execa('bin/cypress', ['help'], options).then(snapshot)
    })

    it('catches environment "foo"', () => {
      const options = {
        env: {
          CYPRESS_INTERNAL_ENV: 'foo',
        },
        // we are only interested in the exit code
        filter: ['code', 'stderr'],
      }

      return execa('bin/cypress', ['help'], options)
      .then(sanitizePlatform)
      .then(snapshot)
    })
  })

  context('cypress version', () => {
    let restoreEnv

    afterEach(() => {
      if (restoreEnv) {
        restoreEnv()
        restoreEnv = null
      }
    })

    const binaryDir = '/binary/dir'

    beforeEach(() => {
      sinon.stub(state, 'getBinaryDir').returns(binaryDir)
    })

    describe('individual package versions', () => {
      beforeEach(() => {
        sinon.stub(util, 'pkgVersion').returns('1.2.3')
        sinon
        .stub(state, 'getBinaryPkgAsync')
        .withArgs(binaryDir)
        .resolves({
          version: 'X.Y.Z',
          electronVersion: '10.9.8',
          electronNodeVersion: '7.7.7',
        })
      })

      it('reports just the package version', (done) => {
        this.exec('version --component package')
        process.exit.callsFake(() => {
          expect(logger.print()).to.equal('1.2.3')
          done()
        })
      })

      it('reports just the binary version', (done) => {
        this.exec('version --component binary')
        process.exit.callsFake(() => {
          expect(logger.print()).to.equal('X.Y.Z')
          done()
        })
      })

      it('reports just the electron version', (done) => {
        this.exec('version --component electron')
        process.exit.callsFake(() => {
          expect(logger.print()).to.equal('10.9.8')
          done()
        })
      })

      it('reports just the bundled Node version', (done) => {
        this.exec('version --component node')
        process.exit.callsFake(() => {
          expect(logger.print()).to.equal('7.7.7')
          done()
        })
      })

      it('handles not found bundled Node version', (done) => {
        state.getBinaryPkgAsync
        .withArgs(binaryDir)
        .resolves({
          version: 'X.Y.Z',
          electronVersion: '10.9.8',
        })

        this.exec('version --component node')
        process.exit.callsFake(() => {
          expect(logger.print()).to.equal('not found')
          done()
        })
      })
    })

    it('reports package version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon
      .stub(state, 'getBinaryPkgAsync')
      .withArgs(binaryDir)
      .resolves({
        version: 'X.Y.Z',
      })

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version 1', logger.print())
        done()
      })
    })

    it('reports package and binary message', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves({ version: 'X.Y.Z' })

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version 2', logger.print())
        done()
      })
    })

    it('reports electron and node message', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves({
        version: 'X.Y.Z',
        electronVersion: '10.10.88',
        electronNodeVersion: '11.10.3',
      })

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version with electron and node 1', logger.print())
        done()
      })
    })

    it('reports package and binary message with npm log silent', (done) => {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'silent',
      })

      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves({ version: 'X.Y.Z' })

      this.exec('version')
      process.exit.callsFake(() => {
        // should not be empty!
        snapshot('cli version and binary version with npm log silent', logger.print())
        done()
      })
    })

    it('reports package and binary message with npm log warn', (done) => {
      restoreEnv = mockedEnv({
        npm_config_loglevel: 'warn',
      })

      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves({
        version: 'X.Y.Z',
      })

      this.exec('version')
      process.exit.callsFake(() => {
        // should not be empty!
        snapshot('cli version and binary version with npm log warn', logger.print())
        done()
      })
    })

    it('handles non-existent binary version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves(null)

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version no binary version 1', logger.print())
        done()
      })
    })

    it('handles non-existent binary --version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves(null)

      this.exec('--version')
      process.exit.callsFake(() => {
        snapshot('cli --version no binary version 1', logger.print())
        done()
      })
    })

    it('handles non-existent binary -v', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgAsync').resolves(null)

      this.exec('-v')
      process.exit.callsFake(() => {
        snapshot('cli -v no binary version 1', logger.print())
        done()
      })
    })
  })

  context('cypress run', () => {
    beforeEach(() => {
      sinon.stub(run, 'start').resolves(0)
      sinon.stub(util, 'exit').withArgs(0)
    })

    it('calls run.start with options + exits with code', (done) => {
      run.start.resolves(10)
      this.exec('run')

      util.exit.callsFake((code) => {
        expect(code).to.eq(10)
        done()
      })
    })

    it('run.start with options + catches errors', (done) => {
      const err = new Error('foo')

      run.start.rejects(err)
      this.exec('run')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })

    it('calls run with port', () => {
      this.exec('run --port 7878')
      expect(run.start).to.be.calledWith({ port: '7878' })
    })

    it('calls run with port with -p arg', () => {
      this.exec('run -p 8989')
      expect(run.start).to.be.calledWith({ port: '8989' })
    })

    it('calls run with env variables', () => {
      this.exec('run --env foo=bar,host=http://localhost:8888')
      expect(run.start).to.be.calledWith({
        env: 'foo=bar,host=http://localhost:8888',
      })
    })

    it('calls run with config', () => {
      this.exec('run --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).to.be.calledWith({
        config: 'watchForFileChanges=false,baseUrl=localhost',
      })
    })

    it('calls run with key', () => {
      this.exec('run --key asdf')
      expect(run.start).to.be.calledWith({ key: 'asdf' })
    })

    it('calls run with --record', () => {
      this.exec('run --record')
      expect(run.start).to.be.calledWith({ record: true })
    })

    it('calls run with --record false', () => {
      this.exec('run --record false')
      expect(run.start).to.be.calledWith({ record: false })
    })

    it('calls run with relative --project folder', () => {
      this.exec('run --project foo/bar')
      expect(run.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls run with absolute --project folder', () => {
      this.exec('run --project /tmp/foo/bar')
      expect(run.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls run with headed', () => {
      this.exec('run --headed')
      expect(run.start).to.be.calledWith({ headed: true })
    })

    it('calls run with --no-exit', () => {
      this.exec('run --no-exit')
      expect(run.start).to.be.calledWith({ exit: false })
    })

    it('calls run with --parallel', () => {
      this.exec('run --parallel')
      expect(run.start).to.be.calledWith({ parallel: true })
    })

    it('calls run with --ci-build-id', () => {
      this.exec('run --ci-build-id 123')
      expect(run.start).to.be.calledWith({ ciBuildId: '123' })
    })

    it('calls run with --group', () => {
      this.exec('run --group staging')
      expect(run.start).to.be.calledWith({ group: 'staging' })
    })

    it('calls run with spec', () => {
      this.exec('run --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith({
        spec: 'cypress/integration/foo_spec.js',
      })
    })

    it('calls run with space-separated --spec', () => {
      this.exec('run --spec a b c d e f g')
      expect(run.start).to.be.calledWith({ spec: 'a,b,c,d,e,f,g' })
      this.exec('run --dev bang --spec foo bar baz -P ./')
      expect(run.start).to.be.calledWithMatch({ spec: 'foo,bar,baz' })
    })

    it('warns with space-separated --spec', (done) => {
      sinon.spy(logger, 'warn')
      this.exec('run --spec a b c d e f g --dev')
      snapshot(logger.warn.getCall(0).args[0])
      done()
    })

    it('calls run with --tag', () => {
      this.exec('run --tag nightly')
      expect(run.start).to.be.calledWith({ tag: 'nightly' })
    })

    it('calls run comma-separated --tag', () => {
      this.exec('run --tag nightly,staging')
      expect(run.start).to.be.calledWith({ tag: 'nightly,staging' })
    })

    it('does not remove double quotes from --tag', () => {
      // I think it is a good idea to lock down this behavior
      // to make sure we either preserve it or change it in the future
      this.exec('run --tag "nightly"')
      expect(run.start).to.be.calledWith({ tag: '"nightly"' })
    })

    it('calls run comma-separated --spec', () => {
      this.exec('run --spec main_spec.js,view_spec.js')
      expect(run.start).to.be.calledWith({ spec: 'main_spec.js,view_spec.js' })
    })

    it('calls run with space-separated --tag', () => {
      this.exec('run --tag a b c d e f g')
      expect(run.start).to.be.calledWith({ tag: 'a,b,c,d,e,f,g' })
      this.exec('run --dev bang --tag foo bar baz -P ./')
      expect(run.start).to.be.calledWithMatch({ tag: 'foo,bar,baz' })
    })

    it('warns with space-separated --tag', (done) => {
      sinon.spy(logger, 'warn')
      this.exec('run --tag a b c d e f g --dev')
      snapshot(logger.warn.getCall(0).args[0])
      done()
    })

    it('calls run with space-separated --tag and --spec', () => {
      this.exec('run --tag a b c d e f g --spec h i j k l')
      expect(run.start).to.be.calledWith({ tag: 'a,b,c,d,e,f,g', spec: 'h,i,j,k,l' })
      this.exec('run --dev bang --tag foo bar baz -P ./ --spec fizz buzz --headed false')
      expect(run.start).to.be.calledWithMatch({ tag: 'foo,bar,baz', spec: 'fizz,buzz' })
    })

    it('removes stray double quotes from --ci-build-id and --group', () => {
      this.exec('run --ci-build-id "123" --group "staging"')
      expect(run.start).to.be.calledWith({ ciBuildId: '123', group: 'staging' })
    })
  })

  context('cypress open', () => {
    beforeEach(() => {
      sinon.stub(open, 'start').resolves(0)
    })

    it('calls open.start with relative --project folder', () => {
      this.exec('open --project foo/bar')
      expect(open.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls open.start with absolute --project folder', () => {
      this.exec('open --project /tmp/foo/bar')
      expect(open.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls open.start with options', () => {
      // sinon.stub(open, 'start').resolves()
      this.exec('open --port 7878')
      expect(open.start).to.be.calledWith({ port: '7878' })
    })

    it('calls open.start with global', () => {
      // sinon.stub(open, 'start').resolves()
      this.exec('open --port 7878 --global')
      expect(open.start).to.be.calledWith({ port: '7878', global: true })
    })

    it('calls open.start + catches errors', (done) => {
      const err = new Error('foo')

      open.start.rejects(err)
      this.exec('open --port 7878')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress install', () => {
    it('calls install.start without forcing', () => {
      sinon.stub(install, 'start').resolves()
      this.exec('install')
      expect(install.start).not.to.be.calledWith({ force: true })
    })

    it('calls install.start with force: true when passed', () => {
      sinon.stub(install, 'start').resolves()
      this.exec('install --force')
      expect(install.start).to.be.calledWith({ force: true })
    })

    it('install calls install.start + catches errors', (done) => {
      const err = new Error('foo')

      sinon.stub(install, 'start').rejects(err)
      this.exec('install')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress verify', () => {
    it('verify calls verify.start with force: true', () => {
      sinon.stub(verify, 'start').resolves()
      this.exec('verify')
      expect(verify.start).to.be.calledWith({
        force: true,
        welcomeMessage: false,
      })
    })

    it('verify calls verify.start + catches errors', (done) => {
      const err = new Error('foo')

      sinon.stub(verify, 'start').rejects(err)
      this.exec('verify')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('cypress info', () => {
    beforeEach(() => {
      sinon.stub(info, 'start').resolves(0)
      sinon.stub(util, 'exit').withArgs(0)
    })

    it('calls info start', () => {
      this.exec('info')
      expect(info.start).to.have.been.calledWith()
    })
  })

  context('cypress cache list', () => {
    it('prints explanation when no cache', (done) => {
      const err = new Error()

      err.code = 'ENOENT'

      sinon.stub(cache, 'list').rejects(err)
      this.exec('cache list')

      process.exit.callsFake(() => {
        snapshot('prints explanation when no cache', logger.print())
        done()
      })
    })

    it('catches rejection and exits', (done) => {
      const err = new Error('cache list failed badly')

      sinon.stub(cache, 'list').rejects(err)
      this.exec('cache list')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })

  context('component-testing', () => {
    beforeEach(() => {
      sinon.stub(spawn, 'start').resolves()
    })

    it('spawns server with correct args for component-testing', () => {
      this.exec('open --component --dev')
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })

    it('spawns server with correct args for depricated component-testing command', () => {
      this.exec('open-ct --dev')
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })

    it('runs server with correct args for component-testing', () => {
      this.exec('run --component --dev')
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })

    it('runs server with correct args for depricated component-testing command', () => {
      this.exec('run-ct --dev')
      expect(spawn.start.firstCall.args[0]).to.include('--testing-type')
      expect(spawn.start.firstCall.args[0]).to.include('component')
    })

    it('does display open-ct command in the help', () => {
      return execa('bin/cypress', ['help']).then((result) => {
        expect(result).to.include('open-ct')
      })
    })

    it('does display run-ct command in the help', () => {
      return execa('bin/cypress', ['help']).then((result) => {
        expect(result).to.include('run-ct')
      })
    })
  })
})
