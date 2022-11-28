require('../../spec_helper')

const verify = require(`${lib}/tasks/verify`)
const spawn = require(`${lib}/exec/spawn`)
const open = require(`${lib}/exec/open`)
const util = require(`${lib}/util`)

describe('exec open', function () {
  context('.start', function () {
    beforeEach(function () {
      sinon.stub(util, 'isInstalledGlobally').returns(true)
      sinon.stub(verify, 'start').resolves()
      sinon.stub(spawn, 'start').resolves()
    })

    it('verifies download', function () {
      return open.start()
      .then(() => {
        expect(verify.start).to.be.called
      })
    })

    it('calls spawn with correct options', function () {
      return open.start({ dev: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith([], {
          detached: false,
          dev: true,
        })
      })
    })

    it('spawns with port', function () {
      return open.start({ port: '1234' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--port', '1234'])
      })
    })

    it('spawns with --env', function () {
      return open.start({ env: 'host=http://localhost:1337,name=brian' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--env', 'host=http://localhost:1337,name=brian'],
        )
      })
    })

    it('spawns with --config', function () {
      return open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--config', 'watchForFileChanges=false,baseUrl=localhost'],
        )
      })
    })

    it('spawns with --config-file set', function () {
      return open.start({ configFile: 'special-cypress.config.js' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--config-file', 'special-cypress.config.js'],
        )
      })
    })

    it('spawns with cwd as --project if not installed globally', function () {
      util.isInstalledGlobally.returns(false)

      return open.start()
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--project', process.cwd()],
        )
      })
    })

    it('spawns without --project if not installed globally and passing --global option', function () {
      util.isInstalledGlobally.returns(false)

      return open.start({ global: true })
      .then(() => {
        expect(spawn.start).not.to.be.calledWith(
          ['--project', process.cwd()],
        )
      })
    })

    it('spawns with --project passed in as options even when not installed globally', function () {
      util.isInstalledGlobally.returns(false)

      return open.start({ project: '/path/to/project' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--project', '/path/to/project'],
        )
      })
    })

    it('spawns with --project if specified and installed globally', function () {
      return open.start({ project: '/path/to/project' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(
          ['--project', '/path/to/project'],
        )
      })
    })

    it('spawns without --project if not specified and installed globally', function () {
      return open.start()
      .then(() => {
        expect(spawn.start).to.be.calledWith([])
      })
    })

    it('spawns without --testing-type when not specified', () => {
      return open.start().then(() => {
        expect(spawn.start).to.be.calledWith([])
      })
    })

    it('spawns with --testing-type e2e', () => {
      return open.start({ testingType: 'e2e' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--testing-type', 'e2e'])
      })
    })

    it('spawns with --testing-type component', () => {
      return open.start({ testingType: 'component' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--testing-type', 'component'])
      })
    })

    it('throws if --testing-type is invalid', () => {
      expect(() => open.processOpenOptions({ testingType: 'randomTestingType' })).to.throw()
    })

    it('throws if --config-file is false', () => {
      expect(() => open.processOpenOptions({ configFile: 'false' })).to.throw()
    })
  })
})
