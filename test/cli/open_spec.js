require('../spec_helper')

const utils = require('../../lib/cli/utils')
const open = require('../../lib/cli/open')

describe('cli open', function () {
  context('#open', function () {
    beforeEach(function () {
      this.sandbox.stub(utils, 'spawn')
    })

    it('calls spawn with correct options', function () {
      open.start()
      expect(utils.spawn).to.be.calledWith([], {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
      })
    })

    it('spawns with port', function () {
      open.start({ port: '1234' })
      expect(utils.spawn).to.be.calledWith(['--port', '1234'])
    })

    it('spawns --project with --env', function () {
      open.start({ env: 'host=http://localhost:1337,name=brian' })
      expect(utils.spawn).to.be.calledWith(['--env', 'host=http://localhost:1337,name=brian'])
    })

    it('spawns --project with --config', function () {
      open.start({ config: 'watchForFileChanges=false,baseUrl=localhost' })
      expect(utils.spawn).to.be.calledWith(['--config', 'watchForFileChanges=false,baseUrl=localhost'])
    })
  })
})
