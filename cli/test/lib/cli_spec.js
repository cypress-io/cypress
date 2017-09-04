require('../spec_helper')

const cli = require(`${lib}/cli`)
const run = require(`${lib}/exec/run`)
const open = require(`${lib}/exec/open`)
const verify = require(`${lib}/tasks/verify`)
const install = require(`${lib}/tasks/install`)

describe('cli', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
    this.exec = (args) => cli.init().parse(`node test ${args}`.split(' '))
  })

  it('exits when done', function (done) {
    this.sandbox.stub(run, 'start').resolves()
    this.exec('run --port 7878')

    process.exit.callsFake(done)
  })

  it('run calls run.start with options', function () {
    this.sandbox.stub(run, 'start').resolves()
    this.exec('run --port 7878')
    expect(run.start).to.be.calledWith({ port: '7878' })
  })

  it('open calls open.start with options', function () {
    this.sandbox.stub(open, 'start').resolves()
    this.exec('open --port 7878')
    expect(open.start).to.be.calledWith({ port: '7878' })
  })

  it('install calls install.start with force: true', function () {
    this.sandbox.stub(install, 'start').resolves()
    this.exec('install')
    expect(install.start).to.be.calledWith({ force: true })
  })

  it('verify calls verify.start with force: true', function () {
    this.sandbox.stub(verify, 'start').resolves()
    this.exec('verify')
    expect(verify.start).to.be.calledWith({ force: true })
  })
})
