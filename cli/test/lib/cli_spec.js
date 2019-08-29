require('../spec_helper')

const os = require('os')
const cli = require(`${lib}/cli`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const run = require(`${lib}/exec/run`)
const open = require(`${lib}/exec/open`)
const state = require(`${lib}/tasks/state`)
const verify = require(`${lib}/tasks/verify`)
const install = require(`${lib}/tasks/install`)
const snapshot = require('../support/snapshot')
const execa = require('execa-wrap')

describe('cli', () => {
  require('mocha-banner').register()

  beforeEach(() => {
    logger.reset()
    sinon.stub(process, 'exit')
    os.platform.returns('darwin')
    // sinon.stub(util, 'exit')
    sinon.stub(util, 'logErrorExit1')
    this.exec = (args) => {
      return cli.init(`node test ${args}`.split(' '))
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

  context('CYPRESS_ENV', () => {
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

    it('allows staging environment', () => {
      const options = {
        env: {
          CYPRESS_ENV: 'staging',
        },
        // we are only interested in the exit code
        filter: ['code', 'stderr'],
      }

      return execa('bin/cypress', ['help'], options).then(snapshot)
    })

    it('catches environment "foo"', () => {
      const options = {
        env: {
          CYPRESS_ENV: 'foo',
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
    const binaryDir = '/binary/dir'

    beforeEach(() => {
      sinon.stub(state, 'getBinaryDir').returns(binaryDir)
    })

    it('reports package version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon
      .stub(state, 'getBinaryPkgVersionAsync')
      .withArgs(binaryDir)
      .resolves('X.Y.Z')

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version 1', logger.print())
        done()
      })
    })

    it('reports package and binary message', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('X.Y.Z')

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version 2', logger.print())
        done()
      })
    })

    it('handles non-existent binary version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version no binary version 1', logger.print())
        done()
      })
    })

    it('handles non-existent binary --version', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

      this.exec('--version')
      process.exit.callsFake(() => {
        snapshot('cli --version no binary version 1', logger.print())
        done()
      })
    })

    it('handles non-existent binary -v', (done) => {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

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

    it('calls run with spec', () => {
      this.exec('run --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith({
        spec: 'cypress/integration/foo_spec.js',
      })
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

    it('calls run with space-separated --specs', () => {
      this.exec('run --spec a b c d e f g')
      expect(run.start).to.be.calledWith({ spec: 'a,b,c,d,e,f,g' })
      this.exec('run --dev bang --spec foo bar baz -P ./')
      expect(run.start).to.be.calledWithMatch({ spec: 'foo,bar,baz' })
    })

    it('warns with space-separated --specs', (done) => {
      sinon.spy(logger, 'warn')
      this.exec('run --spec a b c d e f g --dev')
      snapshot(logger.warn.getCall(0).args[0])
      done()
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

  it('install calls install.start without forcing', () => {
    sinon.stub(install, 'start').resolves()
    this.exec('install')
    expect(install.start).not.to.be.calledWith({ force: true })
  })

  it('install calls install.start with force: true when passed', () => {
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
})
