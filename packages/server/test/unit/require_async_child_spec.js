require('../spec_helper')

const tsNodeUtil = require(`../../lib/util/ts_node`)
const runRequireAsyncChild = require(`../../lib/plugins/child/run_require_async_child`)
const resolve = require(`../../lib/util/resolve`)

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

  describe('typescript registration', () => {
    beforeEach(() => {
      sinon.stub(tsNodeUtil, 'register')
      sinon.stub(resolve, 'typescript').returns('/path/to/typescript.js')
    })

    it('registers ts-node only once', function () {
      runRequireAsyncChild(this.ipc, 'cypress.config.js', 'proj-root')
      runRequireAsyncChild(this.ipc, 'cypress.config.js', 'proj-root')

      expect(tsNodeUtil.register).to.be.calledWith(
        'proj-root',
        'cypress.config.js',
      )

      expect(tsNodeUtil.register).to.be.calledOnce
    })
  })

  describe('errors', () => {
    beforeEach(function () {
      sinon.stub(process, 'on')

      this.err = {
        name: 'error name',
        message: 'error message',
      }

      return runRequireAsyncChild(this.ipc, 'cypress.config.js', 'proj-root')
    })

    it('sends the serialized error via ipc on process uncaughtException', function () {
      process.on.withArgs('uncaughtException').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })

    it('sends the serialized error via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield(this.err)

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })

    it('sends the serialized reason via ipc on process unhandledRejection', function () {
      process.on.withArgs('unhandledRejection').yield({ reason: this.err })

      expect(this.ipc.send).to.be.calledWith('error', this.err)
    })
  })
})
