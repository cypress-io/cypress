const { sinon } = Cypress

describe('component testing', () => {
  let uncaughtExceptionStub

  before(() => {
    uncaughtExceptionStub = cy.stub()

    Cypress.on('uncaught:exception', (err) => {
      uncaughtExceptionStub(null)

      return false
    })
  })

  beforeEach(() => {
    uncaughtExceptionStub.resetHistory()
    const root = document.querySelector('[data-cy-root]')

    if (root) {
      root.innerHTML = ''
    }
  })

  it('fails and shows an error', () => {
    cy.spy(Cypress, 'log').log(false)
    const $el = document.createElement('button')

    $el.innerText = `Don't click it!`
    $el.addEventListener('click', () => {
      throw new Error('An error!')
    })

    document.querySelector('[data-cy-root]')?.appendChild($el)
    cy.get('button').click().then(() => {
      expect(uncaughtExceptionStub).to.have.been.calledOnceWithExactly(null)
      expect(Cypress.log).to.be.calledWithMatch(sinon.match({ 'message': `Error: An error!`, name: 'uncaught exception' }))
    })
  })

  it('fails and shows when a promise rejects with a string', () => {
    cy.spy(Cypress, 'log').log(false)
    const $el = document.createElement('button')

    $el.innerText = `Don't click it!`
    // @ts-expect-error - testing an error state
    $el.addEventListener('click', new Promise((_, reject) => {
      reject('Promise rejected with a string!')
    }))

    document.querySelector('[data-cy-root]')?.appendChild($el)
    cy.get('button').click().then(() => {
      expect(uncaughtExceptionStub).to.have.been.calledOnceWithExactly(null)
      expect(Cypress.log).to.be.calledWithMatch(sinon.match({ 'message': `Error: "Promise rejected with a string!"`, name: 'uncaught exception' }))
    })
  })
})
