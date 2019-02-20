const { EventEmitter } = require('events')
const _ = Cypress._

let runner

const addLog = (log) => {
  const defaultLog = {
    event: false,
    hookName: 'test',
    id: _.uniqueId('l'),
    instrument: 'command',
    renderProps: {},
    state: 'passed',
    testId: 'r3',
    type: 'parent',
    url: 'http://example.com',
  }

  runner.emit('reporter:log:add', _.extend(defaultLog, log))
}

describe('commands', () => {
  beforeEach(() => {
    cy.fixture('command_runnables').as('runnables')
    runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then(function (win) {
      win.render({
        runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(function () {
      runner.emit('runnables:ready', this.runnables)
      runner.emit('reporter:start', {})
    })
  })

  it('escapes HTML except strong tags', () => {
    addLog({
      'err': {
        'message': '',
        'name': '',
      },
      'message': 'expected <strong><input /></strong> to equal <strong>1</strong>',
      'name': 'assert',
      'renderProps': {},
      'state': 'failed',
      'url': '',
    })

    cy.contains('.command-message', '<input />')
  })
})
