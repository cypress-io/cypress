require('../spec_helper')

const path = require('path')
const pkg = require('../../package')

const downloadUtils = require('../../lib/download/utils')
const cli = require('../../lib/cli')
const spawn = require('../../lib/exec/spawn')
const run = require('../../lib/exec/run')

describe('exec run', function () {
  beforeEach(function () {
    this.sandbox.stub(process, 'exit')
  })

  context('cli interface', function () {
    beforeEach(function () {
      this.sandbox.stub(run, 'start')

      this.parse = (args) => cli.init().parse(`node test ${args}`.split(' '))
    })

    it('calls run with port', function () {
      this.parse('run --port 7878')
      expect(run.start).to.be.calledWith({ port: '7878' })
    })

    it('calls run with spec', function () {
      this.parse('run --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith({ spec: 'cypress/integration/foo_spec.js' })
    })

    it('calls run with port with -p arg', function () {
      this.parse('run -p 8989')
      expect(run.start).to.be.calledWith({ port: '8989' })
    })

    it('calls run with env variables', function () {
      this.parse('run --env foo=bar,host=http://localhost:8888')
      expect(run.start).to.be.calledWith({ env: 'foo=bar,host=http://localhost:8888' })
    })

    it('calls run with config', function () {
      this.parse('run --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).to.be.calledWith({ config: 'watchForFileChanges=false,baseUrl=localhost' })
    })

    it('calls run with key', function () {
      this.parse('run --key asdf')
      expect(run.start).to.be.calledWith({ key: 'asdf' })
    })

    it('calls run with --record', function () {
      this.parse('run --record')
      expect(run.start).to.be.calledWith({ record: true })
    })

    it('calls run with --record false', function () {
      this.parse('run --record false')
      expect(run.start).to.be.calledWith({ record: false })
    })
  })

  context('#start', function () {
    beforeEach(function () {
      this.sandbox.stub(spawn, 'start')
      this.sandbox.stub(downloadUtils, 'verify').resolves()
      this.log = this.sandbox.spy(console, 'log')
    })

    it('verifies cypress', function () {
      return run.start()
      .then(() => {
        expect(downloadUtils.verify).to.be.calledOnce
      })
    })

    it('logs message and exits if verification failed', function () {
      downloadUtils.verify.rejects({ name: '', message: '', stack: 'An error message' })

      return run.start().then(() => {
        expect(this.log).to.be.calledWith('An error message')
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('spawns --project with --key and xvfb', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start({ port: '1234' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--project', pathToProject, '--port', '1234', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --env', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start({ env: 'host=http://localhost:1337,name=brian' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--project', pathToProject, '--env', 'host=http://localhost:1337,name=brian', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --config', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--project', pathToProject, '--config', 'watchForFileChanges=false,baseUrl=localhost', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --record false', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start({ record: false })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--project', pathToProject, '--record', false, '--cli-version', pkg.version])
      })
    })
  })
})
