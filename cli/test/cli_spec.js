require('./spec_helper')

const cli = require('../lib/cli')
const download = require('../lib/download')
const downloadUtils = require('../lib/download/utils')
const run = require('../lib/exec/run')
const open = require('../lib/exec/open')

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

  it('run calls run#start with options', function () {
    this.sandbox.stub(run, 'start').resolves()
    this.exec('run --port 7878')
    expect(run.start).to.be.calledWith({ port: '7878' })
  })

  it('open calls open#start with options', function () {
    this.sandbox.stub(open, 'start')
    this.exec('open --port 7878')
    expect(open.start).to.be.calledWith({ port: '7878' })
  })

  it('install calls download#install with force: true', function () {
    this.sandbox.stub(download, 'install')
    this.exec('install')
    expect(download.install).to.be.calledWith({ force: true })
  })

  it('verify calls downloadUtils#verify with force: true', function () {
    this.sandbox.stub(downloadUtils, 'verify')
    this.exec('verify')
    expect(downloadUtils.verify).to.be.calledWith({ force: true })
  })
})
