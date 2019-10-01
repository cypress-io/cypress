import sinon from 'sinon'

const runnerStub = () => {
  return {
    on: sinon.stub(),
    emit: sinon.spy(),
  }
}

describe('controls', function () {
  let runner

  beforeEach(function () {
    runner = runnerStub()

    cy.fixture('runnables').as('runnables')

    cy.visit('/dist').then((win) => {
      win.render({
        runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', this.runnables)
      runner.emit('reporter:start', {})
    })
  })

  describe('shortcuts', function () {
    it('stops tests', function () {
      cy.get('body').then(() => {
        expect(runner.emit).to.not.have.been.calledWith('runner:stop')
      })

      cy.get('body').type('s').then(() => {
        expect(runner.emit).to.have.been.calledWith('runner:stop')
      })
    })

    it('resumes tests', function () {
      cy.get('body').then(() => {
        expect(runner.emit).to.not.have.been.calledWith('runner:restart')
      })

      cy.get('body').type('r').then(() => {
        expect(runner.emit).to.have.been.calledWith('runner:restart')
      })
    })

    it('focuses on specs', function () {
      cy.get('body').then(() => {
        expect(runner.emit).to.not.have.been.calledWith('focus:tests')
      })

      cy.get('body').type('f').then(() => {
        expect(runner.emit).to.have.been.calledWith('focus:tests')
      })
    })

    it('has shortcut in tooltips', () => {
      cy.get('.focus-tests > button').trigger('mouseover')
      cy.get('.tooltip').should('have.text', 'View All Tests F')
      cy.get('.focus-tests > button').trigger('mouseout')

      cy.get('button.restart').trigger('mouseover')
      cy.get('.tooltip').should('have.text', 'Run All Tests R')

      cy.window().then((win) => win.state.isRunning = true)
      cy.get('button.stop').trigger('mouseover')
      cy.get('.tooltip').should('have.text', 'Stop Running S')
    })
  })
})
