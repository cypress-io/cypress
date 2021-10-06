const sinon = require('sinon')
const { logger } = require('./logger')

describe('logger', () => {
  // https://github.com/cypress-io/cypress/issues/17542
  it('cy.log() shows all arguments in each line when there are multiple args', () => {
    const spy = sinon.spy(logger, 'log')

    logger.logFormatted({ args: [1, 2, 3] })

    expect(spy).to.have.been.calledWith(`%cArgs:`, 'font-weight: bold')
    expect(spy).to.have.been.calledWith(`%c  [0]:`, 'font-weight: bold', 1)
    expect(spy).to.have.been.calledWith(`%c  [1]:`, 'font-weight: bold', 2)
    expect(spy).to.have.been.calledWith(`%c  [2]:`, 'font-weight: bold', 3)
  })
})
