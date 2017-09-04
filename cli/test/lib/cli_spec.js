require('../spec_helper')

const cli = require(`${lib}/cli`)
const util = require(`${lib}/util`)
const run = require(`${lib}/exec/run`)
const open = require(`${lib}/exec/open`)
const verify = require(`${lib}/tasks/verify`)
const install = require(`${lib}/tasks/install`)

describe('cli', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.sandbox.stub(util, 'exit')
    this.sandbox.stub(util, 'logErrorExit1')
    this.exec = (args) => cli.init().parse(`node test ${args}`.split(' '))
  })

  context('cypress run', function () {
    beforeEach(function () {
      this.sandbox.stub(run, 'start').resolves(0)
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
  })

  it('open calls open.start with options', function () {
    this.sandbox.stub(open, 'start').resolves()
    this.exec('open --port 7878')
    expect(open.start).to.be.calledWith({ port: '7878' })
  })

  it('open calls open.start + catches errors', function (done) {
    const err = new Error('foo')

    this.sandbox.stub(open, 'start').rejects(err)
    this.exec('open --port 7878')

    util.logErrorExit1.callsFake((e) => {
      expect(e).to.eq(err)
      done()
    })
  })

  it('install calls install.start with force: true', function () {
    this.sandbox.stub(install, 'start').resolves()
    this.exec('install')
    expect(install.start).to.be.calledWith({ force: true })
  })

  it('install calls install.start + catches errors', function (done) {
    const err = new Error('foo')

    this.sandbox.stub(install, 'start').rejects(err)
    this.exec('install')

    util.logErrorExit1.callsFake((e) => {
      expect(e).to.eq(err)
      done()
    })
  })

  it('verify calls verify.start with force: true', function () {
    this.sandbox.stub(verify, 'start').resolves()
    this.exec('verify')
    expect(verify.start).to.be.calledWith({ force: true })
  })

  it('verify calls verify.start + catches errors', function (done) {
    const err = new Error('foo')

    this.sandbox.stub(verify, 'start').rejects(err)
    this.exec('verify')

    util.logErrorExit1.callsFake((e) => {
      expect(e).to.eq(err)
      done()
    })
  })
})
