import { EventEmitter } from 'events'
import CommandModel from './../../src/commands/command-model'

const { _ } = Cypress

interface File {
  file: string
  line: number
  column: number
}

interface HandlesFileOpeningProps {
  getRunner: Function
  selector: string
  file: File
  stackTrace?: boolean
}

export const itHandlesFileOpening = ({ getRunner, selector, file, stackTrace = false }: HandlesFileOpeningProps) => {
  describe('it handles file opening', () => {
    it('emits unified file open event', () => {
      cy.stub(getRunner(), 'emit').callThrough()

      if (stackTrace) {
        cy.contains('View stack trace').click()
      }

      cy.get(selector).first().click().then(() => {
        expect(getRunner().emit).to.be.calledWith('open:file:unified')
      })
    })
  })
}

export const addCommand = (runner: EventEmitter, log: Partial<CommandModel>) => {
  const defaultLog = {
    event: false,
    hookId: 'r3',
    id: _.uniqueId('c'),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: 'r3',
    testCurrentRetry: 0,
    timeout: 4000,
    type: 'parent',
    url: 'http://example.com',
    hasConsoleProps: true,
  }

  const commandLog = Object.assign(defaultLog, log)

  runner.emit('reporter:log:add', commandLog)

  // return command log id to enable adding new command to command group
  return commandLog.id
}
