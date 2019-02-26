import _ from 'lodash'
import sinon from 'sinon'

import Command from './command-model'

const LONG_RUNNING_THRESHOLD = 1000

const model = (props) => {
  return _.extend({
    renderProps: {},
    err: {},
    event: false,
    number: 1,
    numElements: 1,
    state: 'pending',
    visible: true,
  }, props)
}

describe('Command model', () => {
  let clock

  before(() => {
    clock = sinon.useFakeTimers()
  })

  after(() => {
    clock.restore()
  })

  context('.isLongRunning', () => {

    describe('when model is pending on initialization and LONG_RUNNING_THRESHOLD passes', () => {
      let command

      beforeEach(() => {
        command = new Command(model())
      })

      it('sets isLongRunning to true if model is still pending', () => {
        clock.tick(LONG_RUNNING_THRESHOLD)
        expect(command.isLongRunning).to.be.true
      })

      it('does not set isLongRunning to true if model is no longer pending', () => {
        command.state = 'passed'
        clock.tick(LONG_RUNNING_THRESHOLD)
        expect(command.isLongRunning).to.be.false
      })
    })
  })

  describe('when model is not pending on initialization, is updated to pending, and LONG_RUNNING_THRESHOLD passes', () => {
    let command

    beforeEach(() => {
      command = new Command(model({ state: null }))
      clock.tick(300)
      command.update({ state: 'pending' })
    })

    it('sets isLongRunning to true if model is still pending', () => {
      clock.tick(LONG_RUNNING_THRESHOLD)
      expect(command.isLongRunning).to.be.true
    })

    it('does not set isLongRunning to true if model is no longer pending', () => {
      command.state = 'passed'
      clock.tick(LONG_RUNNING_THRESHOLD)
      expect(command.isLongRunning).to.be.false
    })
  })
})
