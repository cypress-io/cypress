require('../../spec_helper')

const snapshot = require('snap-shot-it')

const util = require(`${lib}/util`)
const run = require(`${lib}/exec/run`)
const spawn = require(`${lib}/exec/spawn`)
const verify = require(`${lib}/tasks/verify`)

describe('exec run', function () {
  beforeEach(function () {
    sinon.stub(util, 'isInstalledGlobally').returns(true)
    sinon.stub(process, 'exit')
  })

  context('.processRunOptions', function () {
    it('passes --browser option', () => {
      const args = run.processRunOptions({
        browser: 'test browser',
      })
      snapshot(args)
    })

    it('passes --record option', () => {
      const args = run.processRunOptions({
        record: 'my record id',
      })
      snapshot(args)
    })

    it('does not remove --record option when using --browser', () => {
      const args = run.processRunOptions({
        record: 'foo',
        browser: 'test browser',
      })
      snapshot(args)
    })
  })

  context('.start', function () {
    beforeEach(function () {
      sinon.stub(spawn, 'start').resolves()
      sinon.stub(verify, 'start').resolves()
    })

    it('verifies cypress', function () {
      return run.start()
      .then(() => {
        expect(verify.start).to.be.calledOnce
      })
    })

    it('spawns with --key and xvfb', function () {
      return run.start({ port: '1234' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--run-project', process.cwd(), '--port', '1234'])
      })
    })

    it('spawns with --env', function () {
      return run.start({ env: 'host=http://localhost:1337,name=brian' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--run-project', process.cwd(), '--env', 'host=http://localhost:1337,name=brian'])
      })
    })

    it('spawns with --config', function () {
      return run.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--run-project', process.cwd(), '--config', 'watchForFileChanges=false,baseUrl=localhost'])
      })
    })

    it('spawns with --record false', function () {
      return run.start({ record: false })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--run-project', process.cwd(), '--record', false])
      })
    })

    it('spawns with --headed true', function () {
      return run.start({ headed: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith([
          '--run-project', process.cwd(), '--headed', true,
        ])
      })
    })

    it('spawns with --no-exit', function () {
      return run.start({ exit: false })
      .then(() => {
        expect(spawn.start).to.be.calledWith([
          '--run-project', process.cwd(), '--no-exit',
        ])
      })
    })

    it('spawns with --output-path', function () {
      return run.start({ outputPath: '/path/to/output' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--run-project', process.cwd(), '--output-path', '/path/to/output'])
      })
    })
  })
})
