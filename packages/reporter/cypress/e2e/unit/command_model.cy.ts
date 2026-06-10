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

  context('.visible', () => {
    let command: CommandModel

    it('sets visible to true for command has visible elements associated to it', () => {
      command = new CommandModel(commandProps({ visible: true }))
      expect(command.visible).to.be.true
    })

    it('sets visible to false for command has hidden elements associated to it', () => {
      command = new CommandModel(commandProps({ visible: false }))
      expect(command.visible).to.be.false
    })

    it('sets visible to true for command that does not associate with visibility', () => {
      command = new CommandModel(commandProps({ visible: undefined }))
      expect(command.visible).to.be.true
    })
  })

  context('.numChildren', () => {
    context('event log', () => {
      it('with no children', () => {
        const command = new CommandModel(commandProps({ event: true }))

        expect(command.numChildren).to.eq(1)
      })

      it('with children', () => {
        const command = new CommandModel(commandProps({ event: true }))

        command.addChild(new CommandModel(commandProps()))
        expect(command.numChildren).to.eq(2)

        command.addChild(new CommandModel(commandProps()))
        expect(command.numChildren).to.eq(3)
      })
    })

    context('command log', () => {
      it('with no children', () => {
        const command = new CommandModel(commandProps({}))

        expect(command.numChildren).to.eq(0)
      })

      it('with children', () => {
        const command = new CommandModel(commandProps({}))

        command.addChild(new CommandModel(commandProps()))
        expect(command.numChildren).to.eq(1)

        command.addChild(new CommandModel(commandProps()))
        expect(command.numChildren).to.eq(2)
      })

      it('with children that are a command group', () => {
        const command = new CommandModel(commandProps({}))

        command.addChild(new CommandModel(commandProps()))

        const commandGroup = new CommandModel(commandProps())

        commandGroup.addChild(new CommandModel(commandProps()))
        commandGroup.addChild(new CommandModel(commandProps()))

        command.addChild(commandGroup)
        expect(command.numChildren).to.eq(4)
      })
    })
  })

  context('.hasChildren', () => {
    context('event log', () => {
      it('with no children', () => {
        const command = new CommandModel(commandProps({ event: true }))

        expect(command.hasChildren).to.be.false
      })

      it('with one or more children', () => {
        const command = new CommandModel(commandProps({ event: true }))

        command.addChild(new CommandModel(commandProps()))

        expect(command.hasChildren).to.be.true
      })
    })

    context('command log', () => {
      it('with no children', () => {
        const command = new CommandModel(commandProps({}))

        expect(command.hasChildren).to.be.false
      })

      it('with one or more children', () => {
        const command = new CommandModel(commandProps({}))

        command.addChild(new CommandModel(commandProps()))
        expect(command.hasChildren).to.be.true
      })
    })
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

  context('.matches', () => {
    it('matches commands with the same type, name and displayMessage', () => {
      const command = new CommandModel(commandProps({ name: 'get', type: 'parent', message: '#foo' }))
      const other = new CommandModel(commandProps({ name: 'get', type: 'parent', message: '#foo' }))

      expect(command.matches(other)).to.be.true
    })

    it('does not match commands with different displayMessages', () => {
      const command = new CommandModel(commandProps({ name: 'get', type: 'parent', message: '#foo' }))
      const other = new CommandModel(commandProps({ name: 'get', type: 'parent', message: '#bar' }))

      expect(command.matches(other)).to.be.false
    })

    // https://github.com/cypress-io/cypress/issues/28903
    context('request event logs', () => {
      const requestProps = (props?: Partial<CommandProps>) => {
        return commandProps(Object.assign({
          name: 'request',
          type: 'parent',
          event: true,
          method: 'GET',
          url: 'http://localhost/test/1',
        }, props))
      }

      it('matches on method and url regardless of the response status in the message', () => {
        // the response has been received for one request but not the other, so
        // the status is only present in one of the display messages
        const command = new CommandModel(requestProps({ renderProps: { message: 'GET 200 /test/1' } }))
        const other = new CommandModel(requestProps({ renderProps: { message: 'GET /test/1' } }))

        expect(command.matches(other)).to.be.true
      })

      it('does not match requests to different urls', () => {
        const command = new CommandModel(requestProps({ url: 'http://localhost/test/1' }))
        const other = new CommandModel(requestProps({ url: 'http://localhost/test/2' }))

        expect(command.matches(other)).to.be.false
      })

      it('does not match requests with different methods', () => {
        const command = new CommandModel(requestProps({ method: 'GET' }))
        const other = new CommandModel(requestProps({ method: 'POST' }))

        expect(command.matches(other)).to.be.false
      })
    })
  })
})
