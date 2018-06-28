require('../spec_helper')

const cli = require(`${lib}/cli`)
const util = require(`${lib}/util`)
const logger = require(`${lib}/logger`)
const run = require(`${lib}/exec/run`)
const open = require(`${lib}/exec/open`)
const state = require(`${lib}/tasks/state`)
const verify = require(`${lib}/tasks/verify`)
const install = require(`${lib}/tasks/install`)
const snapshot = require('snap-shot-it')
const execa = require('execa-wrap')

describe('cli', function () {
  require('mocha-banner').register()

  beforeEach(function () {
    logger.reset()
    sinon.stub(process, 'exit')
    sinon.stub(util, 'exit')
    sinon.stub(util, 'logErrorExit1')
    this.exec = (args) => cli.init(`node test ${args}`.split(' '))
  })

  context('unknown option', () => {
    // note it shows help for that specific command
    it('shows help', () =>
      execa('bin/cypress', ['open', '--foo']).then((result) => {
        snapshot('shows help for open --foo', result)
      })
    )

    it('shows help for run command', () =>
      execa('bin/cypress', ['run', '--foo']).then((result) => {
        snapshot('shows help for run --foo', result)
      })
    )
  })

  context('help command', () => {
    it('shows help', () =>
      execa('bin/cypress', ['help']).then(snapshot)
    )

    it('shows help for -h', () =>
      execa('bin/cypress', ['-h']).then(snapshot)
    )

    it('shows help for --help', () =>
      execa('bin/cypress', ['--help']).then(snapshot)
    )
  })

  context('unknown command', () => {
    it('shows usage and exits', () =>
      execa('bin/cypress', ['foo']).then(snapshot)
    )
  })

  context('cypress version', function () {
    const binaryDir = '/binary/dir'
    beforeEach(function () {
      sinon.stub(state, 'getBinaryDir').returns(binaryDir)
    })
    it('reports package version', function (done) {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').withArgs(binaryDir).resolves('X.Y.Z')

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version', logger.print())
        done()
      })
    })

    it('reports package and binary message', function (done) {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves('X.Y.Z')

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version and binary version', logger.print())
        done()
      })
    })

    it('handles non-existent binary version', function (done) {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

      this.exec('version')
      process.exit.callsFake(() => {
        snapshot('cli version no binary version', logger.print())
        done()
      })
    })

    it('handles non-existent binary --version', function (done) {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

      this.exec('--version')
      process.exit.callsFake(() => {
        snapshot('cli --version no binary version', logger.print())
        done()
      })
    })

    it('handles non-existent binary -v', function (done) {
      sinon.stub(util, 'pkgVersion').returns('1.2.3')
      sinon.stub(state, 'getBinaryPkgVersionAsync').resolves(null)

      this.exec('-v')
      process.exit.callsFake(() => {
        snapshot('cli -v no binary version', logger.print())
        done()
      })
    })
  })

  context('cypress run', function () {
    beforeEach(function () {
      sinon.stub(run, 'start').resolves(0)
      util.exit.withArgs(0)
    })

    it('calls run.start with options + exits with code', function (done) {
      run.start.resolves(10)
      this.exec('run')

      util.exit.callsFake((code) => {
        expect(code).to.eq(10)
        done()
      })
    })

    it('run.start with options + catches errors', function (done) {
      const err = new Error('foo')
      run.start.rejects(err)
      this.exec('run')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })

    it('calls run with port', function () {
      this.exec('run --port 7878')
      expect(run.start).to.be.calledWith({ port: '7878' })
    })

    it('calls run with spec', function () {
      this.exec('run --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith({ spec: 'cypress/integration/foo_spec.js' })
    })

    it('calls run with port with -p arg', function () {
      this.exec('run -p 8989')
      expect(run.start).to.be.calledWith({ port: '8989' })
    })

    it('calls run with env variables', function () {
      this.exec('run --env foo=bar,host=http://localhost:8888')
      expect(run.start).to.be.calledWith({ env: 'foo=bar,host=http://localhost:8888' })
    })

    it('calls run with config', function () {
      this.exec('run --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).to.be.calledWith({ config: 'watchForFileChanges=false,baseUrl=localhost' })
    })

    it('calls run with key', function () {
      this.exec('run --key asdf')
      expect(run.start).to.be.calledWith({ key: 'asdf' })
    })

    it('calls run with --record', function () {
      this.exec('run --record')
      expect(run.start).to.be.calledWith({ record: true })
    })

    it('calls run with --record false', function () {
      this.exec('run --record false')
      expect(run.start).to.be.calledWith({ record: false })
    })

    it('calls run with relative --project folder', function () {
      this.exec('run --project foo/bar')
      expect(run.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls run with absolute --project folder', function () {
      this.exec('run --project /tmp/foo/bar')
      expect(run.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls run with headed', function () {
      this.exec('run --headed')
      expect(run.start).to.be.calledWith({ headed: true })
    })

    it('calls run with --no-exit', function () {
      this.exec('run --no-exit')
      expect(run.start).to.be.calledWith({ exit: false })
    })

  })

  context('cypress open', function () {
    beforeEach(function () {
      sinon.stub(open, 'start').resolves(0)
    })

    it('calls open.start with relative --project folder', function () {
      this.exec('open --project foo/bar')
      expect(open.start).to.be.calledWith({ project: 'foo/bar' })
    })

    it('calls open.start with absolute --project folder', function () {
      this.exec('open --project /tmp/foo/bar')
      expect(open.start).to.be.calledWith({ project: '/tmp/foo/bar' })
    })

    it('calls open.start with options', function () {
      // sinon.stub(open, 'start').resolves()
      this.exec('open --port 7878')
      expect(open.start).to.be.calledWith({ port: '7878' })
    })

    it('calls open.start with global', function () {
      // sinon.stub(open, 'start').resolves()
      this.exec('open --port 7878 --global')
      expect(open.start).to.be.calledWith({ port: '7878', global: true })
    })

    it('calls open.start + catches errors', function (done) {
      const err = new Error('foo')

      open.start.rejects(err)
      this.exec('open --port 7878')

      util.logErrorExit1.callsFake((e) => {
        expect(e).to.eq(err)
        done()
      })
    })
  })


  it('install calls install.start without forcing', function () {
    sinon.stub(install, 'start').resolves()
    this.exec('install')
    expect(install.start).not.to.be.calledWith({ force: true })
  })

  it('install calls install.start with force: true when passed', function () {
    sinon.stub(install, 'start').resolves()
    this.exec('install --force')
    expect(install.start).to.be.calledWith({ force: true })
  })

  it('install calls install.start + catches errors', function (done) {
    const err = new Error('foo')

    sinon.stub(install, 'start').rejects(err)
    this.exec('install')

    util.logErrorExit1.callsFake((e) => {
      expect(e).to.eq(err)
      done()
    })
  })
  context('cypress verify', function () {


    it('verify calls verify.start with force: true', function () {
      sinon.stub(verify, 'start').resolves()
      this.exec('verify')
      expect(verify.start).to.be.calledWith({ force: true, welcomeMessage: false })
    })

    it('verify calls verify.start + catches errors', function (done) {
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
