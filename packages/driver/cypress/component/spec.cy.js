describe('component testing', () => {
  /** @type {Cypress.Agent<sinon.SinonSpy>} */
  let uncaughtExceptionStub

  before(() => {
    uncaughtExceptionStub = cy.stub()

    Cypress.on('uncaught:exception', (err) => {
      uncaughtExceptionStub(null)

      return false
    })
  })

  it('fails and shows an error', () => {
    const $el = document.createElement('button')

    $el.innerText = `Don't click it!`
    $el.addEventListener('click', () => {
      throw Error('An error!')
    })

    document.querySelector('[data-cy-root]').appendChild($el)
    cy.get('button').click().then(() => {
      expect(uncaughtExceptionStub).to.have.been.calledOnceWithExactly(null)
    })
  })
})
