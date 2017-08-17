require('../spec_helper')

const downloadUtils = require('../../lib/download/utils')
const spawn = require('../../lib/exec/spawn')
const open = require('../../lib/exec/open')

describe('exec open', function () {
  context('#start', function () {
    beforeEach(function () {
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

    it('spawns --project with --env', function () {
      return open.start({ env: 'host=http://localhost:1337,name=brian' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--env', 'host=http://localhost:1337,name=brian'])
      })
    })

    it('spawns --project with --config', function () {
      return open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' }).then(() => {
        expect(spawn.start).to.be.calledWith(['--config', 'watchForFileChanges=false,baseUrl=localhost'])
      })
    })
  })
})
