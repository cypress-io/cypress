require('../spec_helper')

const path = require('path')
const pkg = require('../../package')

const download = require('../../lib/download')
const cli = require('../../lib/cli/cli')
const utils = require('../../lib/cli/utils')
const run = require('../../lib/cli/run')

describe('cli run', function () {
  context('cli interface', function () {
    beforeEach(function () {
      this.sandbox.stub(run, 'start')

      this.parse = (args) => cli.init().parse(`node test ${args}`.split(' '))
    })

    it('calls run with port', function () {
      this.parse('run --port 7878')
      expect(run.start).to.be.calledWith(undefined, { port: '7878' })
    })

    it('calls run with spec', function () {
      this.parse('run myApp --spec cypress/integration/foo_spec.js')
      expect(run.start).to.be.calledWith('myApp', { spec: 'cypress/integration/foo_spec.js' })
    })

    it('calls run with port with -p arg', function () {
      this.parse('run 1234 -p 8989')
      expect(run.start).to.be.calledWith('1234', { port: '8989' })
    })

    it('calls run with env variables', function () {
      this.parse('run myApp --env foo=bar,host=http://localhost:8888')
      expect(run.start).to.be.calledWith('myApp', { env: 'foo=bar,host=http://localhost:8888' })
    })

    it('calls run with config', function () {
      this.parse('run myApp --config watchForFileChanges=false,baseUrl=localhost')
      expect(run.start).to.be.calledWith('myApp', { config: 'watchForFileChanges=false,baseUrl=localhost' })
    })

    it('calls run with key', function () {
      this.parse('run --key asdf')
      expect(run.start).to.be.calledWith(undefined, { key: 'asdf' })
    })

    it('calls run with --record', function () {
      this.parse('run --record')
      expect(run.start).to.be.calledWith(undefined, { record: true })
    })

    it('calls run with --record false', function () {
      this.parse('run --record false')
      expect(run.start).to.be.calledWith(undefined, { record: false })
    })
  })

  context('#start', function () {
    beforeEach(function () {
      this.spawn = this.sandbox.stub(utils, 'spawn')
      this.sandbox.stub(download, 'verify').resolves()
      this.log = this.sandbox.spy(console, 'log')
    })

    it('verifies cypress', function () {
      return run.start()
      .then(() => {
        expect(download.verify).to.be.calledOnce
      })
    })

    it('logs message and exits if verification failed', function () {
      this.sandbox.stub(process, 'exit')
      download.verify.rejects({ name: '', message: 'An error message' })

      return run.start().then(() => {
        expect(this.log).to.be.calledWith('An error message')
        expect(process.exit).to.be.calledWith(1)
      })
    })

    it('spawns --project with --key and xvfb', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start(undefined, { port: '1234' })
      .then(() => {
        expect(this.spawn).to.be.calledWith(['--project', pathToProject, '--port', '1234', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --env', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start(undefined, { env: 'host=http://localhost:1337,name=brian' })
      .then(() => {
        expect(this.spawn).to.be.calledWith(['--project', pathToProject, '--env', 'host=http://localhost:1337,name=brian', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --config', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start(undefined, { config: 'watchForFileChanges=false,baseUrl=localhost' })
      .then(() => {
        expect(this.spawn).to.be.calledWith(['--project', pathToProject, '--config', 'watchForFileChanges=false,baseUrl=localhost', '--cli-version', pkg.version])
      })
    })

    it('spawns --project with --record false', function () {
      let pathToProject = path.resolve(process.cwd(), '.')

      return run.start(undefined, { record: false })
      .then(() => {
        expect(this.spawn).to.be.calledWith(['--project', pathToProject, '--record', false, '--cli-version', pkg.version])
      })
    })
  })
})
