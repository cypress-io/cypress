require('../spec_helper')

const downloadUtils = require('../../lib/download/utils')
const spawn = require('../../lib/exec/spawn')
const open = require('../../lib/exec/open')
const util = require('../../lib/util')
const logger = require('../../lib/logger')
const fs = require('../../lib/fs')
const snapshot = require('snap-shot-it')

describe('exec open', function () {
  beforeEach(function () {
    logger.reset()
  })

  context('#start integration', function () {
    it('logs missing when no installed version', function () {
      this.sandbox.stub(util, 'exit')
      this.sandbox.stub(fs, 'readJsonAsync').resolves({})

      return open.start().then(() => {
        throw new Error('should not resolve')
      })
      .catch(() => {
        snapshot(logger.print())
      })
    })
  })

  context('#start', function () {
    beforeEach(function () {
      this.sandbox.stub(util, 'isInstalledGlobally').returns(true)
      this.sandbox.stub(downloadUtils, 'verify').resolves()
      this.sandbox.stub(spawn, 'start').resolves()
    })

    it('verifies download', function () {
      return open.start().then(() => {
        expect(downloadUtils.verify).to.be.called
      })
    })

    it('calls spawn with correct options', function () {
      return open.start().then(() => {
        expect(spawn.start).to.be.calledWith([], {
          detached: false,
          stdio: ['ignore', 'ignore', 'ignore'],
        })
      })
    })

    it('spawns with port', function () {
      return open.start({ port: '1234' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--port', '1234'])
      })
    })

    it('spawns with --env', function () {
      return open.start({ env: 'host=http://localhost:1337,name=brian' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--env', 'host=http://localhost:1337,name=brian'])
      })
    })

    it('spawns with --config', function () {
      return open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--config', 'watchForFileChanges=false,baseUrl=localhost'])
      })
    })

    it('spawns with cwd as --project if not installed globally', function () {
      util.isInstalledGlobally.returns(false)

      return open.start().then(() => {
        expect(spawn.start).to.be.calledWith(['--project', process.cwd()])
      })
    })

    it('spawns with --project if specified and installed globally', function () {
      return open.start({ project: '/path/to/project' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--project', '/path/to/project'])
      })
    })

    it('spawns without --project if not specified and installed globally', function () {
      return open.start().then(() => {
        expect(spawn.start).to.be.calledWith([])
      })
    })
  })
})
