import sinon, { SinonFakeTimers } from 'sinon'

import CommandModel, { CommandProps } from '../../../src/commands/command-model'

const LONG_RUNNING_THRESHOLD = 1000

const commandProps = (props?: Partial<CommandProps>) => {
  return Object.assign({
    renderProps: {},
    err: {},
    event: false,
    number: 1,
    numElements: 1,
    state: 'pending',
    visible: true,
  }, props) as CommandProps
}

describe('Command model', () => {
  let clock: SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  context('.isLongRunning', () => {
    describe('when model is pending on initialization and LONG_RUNNING_THRESHOLD passes', () => {
      let command: CommandModel

      beforeEach(() => {
        command = new CommandModel(commandProps())
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
    let command: CommandModel

    beforeEach(() => {
      command = new CommandModel(commandProps({ state: null }))
      clock.tick(300)
      command.update({ state: 'pending' } as CommandProps)
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
