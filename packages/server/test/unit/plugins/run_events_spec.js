require('../../spec_helper')

const errors = require(`${root}../lib/errors`)
const plugins = require(`${root}../lib/plugins`)
const runEvents = require(`${root}../lib/plugins/run_events`)

describe('lib/plugins/run_events', () => {
  context('#execute', () => {
    beforeEach(() => {
      sinon.stub(plugins, 'execute')
      sinon.stub(plugins, 'has').returns(false)
      sinon.stub(errors, 'throw')
    })

    it('returns a promise noop if event is not registered', () => {
      return runEvents.execute('before:spec', {})
      .then(() => {
        expect(plugins.execute).not.to.be.called
      })
    })

    it('runs plugins.execute', () => {
      plugins.has.returns(true)
      plugins.execute.resolves('the result')

      return runEvents.execute('before:spec', {}, 'arg1', 'arg2')
      .then(() => {
        expect(plugins.execute).to.be.calledWith('before:spec', 'arg1', 'arg2')
      })
    })

    it('returns a promise with result of plugins.execute', () => {
      plugins.has.returns(true)
      plugins.execute.resolves('the result')

      return runEvents.execute('before:spec', {}, 'arg1', 'arg2')
      .then((result) => {
        expect(result).to.equal('the result')
      })
    })

    it('throws custom error if plugins.execute errors', () => {
      plugins.has.returns(true)
      plugins.execute.rejects({ stack: 'The event threw an error' })

      return runEvents.execute('before:spec', {}, 'arg1', 'arg2')
      .then(() => {
        expect(errors.throw).to.be.calledWith('PLUGINS_RUN_EVENT_ERROR', 'before:spec', 'The event threw an error')
      })
    })
  })
})
