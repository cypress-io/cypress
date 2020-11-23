import sinon, { SinonStub, SinonSpy } from 'sinon'
import { EventEmitter } from 'events'

type EventEmitterStub = EventEmitter & Stub

interface Stub {
  on: SinonStub
  emit: SinonSpy
}

const runnerStub = () => {
  return {
    on: sinon.stub(),
    emit: sinon.spy(),
  } as EventEmitterStub
}

describe('shortcuts', function () {
  let runner: EventEmitterStub

  beforeEach(function () {
    runner = runnerStub()

    cy.fixture('runnables').as('runnables')

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', this.runnables)
      runner.emit('reporter:start', {})
    })
  })

  describe('shortcuts', () => {
    it('stops tests', () => {
      cy.get('body').then(() => {
        expect(runner.emit).not.to.have.been.calledWith('runner:stop')
      })

      cy.get('body').type('s').then(() => {
        expect(runner.emit).to.have.been.calledWith('runner:stop')
      })
    })

    it('does not stop tests when paused', () => {
      cy.get('body').then(() => {
        expect(runner.emit).not.to.have.been.calledWith('runner:stop')
      })

      runner.on.withArgs('paused').callArgWith(1, 'next command')

      cy.get('body').type('s').then(() => {
        expect(runner.emit).not.to.have.been.calledWith('runner:stop')
      })
    })

    it('resumes tests', () => {
      cy.get('body').then(() => {
        expect(runner.emit).not.to.have.been.calledWith('runner:restart')
      })

      cy.get('body').type('r').then(() => {
        expect(runner.emit).to.have.been.calledWith('runner:restart')
      })
    })

    it('focuses on specs', () => {
      cy.get('body').then(() => {
        expect(runner.emit).not.to.have.been.calledWith('focus:tests')
      })

      cy.get('body').type('f').then(() => {
        expect(runner.emit).to.have.been.calledWith('focus:tests')
      })
    })

    it('does not run shortcut if typed into an input', () => {
      cy.get('body')
      .then(($body) => {
        // this realistically happens with the selector playground, but
        // need to add an input since this environment is isolated
        $body.append('<input id="temp-input" />')
      })
      .get('#temp-input').type('r', { force: true })
      .then(() => {
        expect(runner.emit).not.to.have.been.calledWith('runner:restart')
      })
    })

    it('has shortcut in tooltips', () => {
      cy.get('.focus-tests > button').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'View All Tests F')
      cy.get('.focus-tests > button').trigger('mouseout')

      cy.get('button.restart').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Run All Tests R')

      cy.window().then((win) => win.state.isRunning = true)
      cy.get('button.stop').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Stop Running S')
    })
  })
})
