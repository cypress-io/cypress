import '../../../spec_helper'

import { run as runRequireAsyncChild } from '../../../../lib/plugins/child/run_require_async_child'

describe('lib/plugins/child/run_require_async_child', () => {
  beforeEach(function () {
    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }
  })

  afterEach(() => {
    mockery.deregisterMock('@cypress/webpack-batteries-included-preprocessor')
  })

  describe('errors', () => {
    beforeEach(function () {
      sinon.stub(process, 'on')

      this.err = {
        name: 'error name',
        message: 'error message',
      }

      return runRequireAsyncChild(this.ipc, 'cypress.config.js', 'proj-root', false)
    })

    it('sends the serialized error via ipc on process uncaughtException', function () {
      process.on.withArgs('uncaughtException').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('sends the serialized error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('unwraps object rejection reason from event.reason on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ reason: this.err })

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })

    it('sends the serialized OpenSSL error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ ...this.err, reason: 'reason' })

      expect(this.ipc.send).to.be.calledWith('childProcess:unhandledError', this.err)
    })
  })
})
