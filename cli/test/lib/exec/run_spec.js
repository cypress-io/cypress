require('../../spec_helper')

const os = require('os')
const snapshot = require('../../support/snapshot')

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
    it('allows string --project option', () => {
      const args = run.processRunOptions({
        project: '/path/to/project',
      })

      expect(args).to.deep.equal(['--run-project', '/path/to/project'])
    })

    it('throws an error for empty string --project', () => {
      expect(() => run.processRunOptions({ project: '' })).to.throw()
    })

    it('throws an error for boolean --project', () => {
      expect(() => run.processRunOptions({ project: false })).to.throw()
      expect(() => run.processRunOptions({ project: true })).to.throw()
    })

    it('throws an error for --project "false" or "true"', () => {
      expect(() => run.processRunOptions({ project: 'false' })).to.throw()
      expect(() => run.processRunOptions({ project: 'true' })).to.throw()
    })

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

    it('passes --config-file false option', () => {
      const args = run.processRunOptions({
        configFile: false,
      })

      snapshot(args)
    })

    it('does not allow setting paradoxical --headed and --headless flags', () => {
      os.platform.returns('linux')
      process.exit.returns()

      expect(() => run.processRunOptions({ headed: true, headless: true })).to.throw()
    })

    it('passes --headed according to --headless', () => {
      expect(run.processRunOptions({ headless: true })).to.deep.eq([
        '--run-project', undefined, '--headed', false,
      ])
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

    it('spawns with --config-file false', function () {
      return run.start({ configFile: false })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--run-project', process.cwd(), '--config-file', false],
        )
      })
    })

    it('spawns with --config-file set', function () {
      return run.start({ configFile: 'special-cypress.json' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--run-project', process.cwd(), '--config-file', 'special-cypress.json'],
        )
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

    it('spawns with --tag value', function () {
      return run.start({ tag: 'nightly' })
      .then(() => {
        expect(spawn.start).to.be.calledWith([
          '--run-project', process.cwd(), '--tag', 'nightly',
        ])
      })
    })

    it('spawns with several --tag words unchanged', function () {
      return run.start({ tag: 'nightly, sanity' })
      .then(() => {
        expect(spawn.start).to.be.calledWith([
          '--run-project', process.cwd(), '--tag', 'nightly, sanity',
        ])
      })
    })
  })
})
