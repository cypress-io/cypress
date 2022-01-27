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
    type: 'parent',
    url: 'http://example.com',
    hasConsoleProps: true,
  }

  runner.emit('reporter:log:add', Object.assign(defaultLog, log))
}
