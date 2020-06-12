require('../../../spec_helper')

const util = require(`${root}../../lib/plugins/util`)
const task = require(`${root}../../lib/plugins/child/task`)

describe('lib/plugins/child/task', () => {
  beforeEach(function () {
    this.ipc = {
      send: sinon.spy(),
      on: sinon.stub(),
      removeListener: sinon.spy(),
    }

    this.events = {
      '1': {
        event: 'task',
        handler: {
          'the:task': sinon.stub().returns('result'),
          'another:task': sinon.stub().returns('result'),
          'a:third:task' () {
            return 'foo'
          },
        },
      },
    }

    this.ids = {}

    return sinon.stub(util, 'wrapChildPromise')
  })

  context('.getBody', () => {
    it('returns the stringified body of the event handler', function () {
      task.getBody(this.ipc, this.events, this.ids, ['a:third:task'])
      expect(util.wrapChildPromise).to.be.called
      const result = util.wrapChildPromise.lastCall.args[1]('1')

      expect(result.replace(/\s+/g, '')).to.equal('\'a:third:task\'(){return\'foo\'}')
    })

    it('returns an empty string if event handler cannot be found', function () {
      task.getBody(this.ipc, this.events, this.ids, ['non:existent'])
      expect(util.wrapChildPromise).to.be.called
      const result = util.wrapChildPromise.lastCall.args[1]('1')

      expect(result).to.equal('')
    })
  })

  context('.getKeys', () => {
    it('returns the registered task keys', function () {
      task.getKeys(this.ipc, this.events, this.ids)
      expect(util.wrapChildPromise).to.be.called
      const result = util.wrapChildPromise.lastCall.args[1]('1')

      expect(result).to.eql(['the:task', 'another:task', 'a:third:task'])
    })
  })

  context('.wrap', () => {
    it('passes through ipc and ids', function () {
      task.wrap(this.ipc, this.events, this.ids, ['the:task'])
      expect(util.wrapChildPromise).to.be.called
      expect(util.wrapChildPromise.lastCall.args[0]).to.be.equal(this.ipc)

      expect(util.wrapChildPromise.lastCall.args[2]).to.be.equal(this.ids)
    })

    it('invokes the callback for the given task if it exists and returns the result', function () {
      task.wrap(this.ipc, this.events, this.ids, ['the:task', 'the:arg'])
      const result = util.wrapChildPromise.lastCall.args[1]('1', ['the:arg'])

      expect(this.events['1'].handler['the:task']).to.be.calledWith('the:arg')

      expect(result).to.equal('result')
    })

    it('returns __cypress_unhandled__ if the task doesn\'t exist', function () {
      task.wrap(this.ipc, this.events, this.ids, ['nope'])

      expect(util.wrapChildPromise.lastCall.args[1]('1')).to.equal('__cypress_unhandled__')
    })
  })
})
