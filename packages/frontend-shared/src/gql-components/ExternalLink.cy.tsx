import ExternalLink from './ExternalLink.vue'
import { ExternalLink_OpenExternalDocument } from '../generated/graphql'

describe('<ExternalLink />', () => {
  let fnStub

  beforeEach(() => {
    const obj = {
      get () {
        return true
      },
    }

    fnStub = cy.stub(obj, 'get')

    cy.mount(() => (
      <ExternalLink
        href='https://on.cypress.io/ci'
        onClick={obj.get}
      >
        Click me!
      </ExternalLink>
    ))
  })

  it('opens external link on click', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.get('[data-cy="external"]')
    .click()

    cy.wrap(urlStub).should('have.been.calledWith', 'https://on.cypress.io/ci')
    cy.wrap(fnStub).should('have.been.calledOnce')
  })

  it('opens external link on click and triggers onClick function', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.get('[data-cy="external"]')
    .click()

    cy.wrap(urlStub).should('have.been.calledWith', 'https://on.cypress.io/ci')
    cy.wrap(fnStub).should('have.been.calledOnce')
  })

  it('opens external link on enter', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.get('[data-cy="external"]')
    .focus()
    .realPress('Enter')

    cy.wrap(urlStub).should('have.been.calledWith', 'https://on.cypress.io/ci')
  })

  it('opens external link on click and enter', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.get('[data-cy="external"]')
    .click()

    cy.get('[data-cy="external"]')
    .focus()
    .realPress('Enter')

    cy.wrap(urlStub).should('have.been.calledTwice')
    cy.wrap(fnStub).should('have.been.calledTwice')
  })

  it('do not open external link on space bar trigger', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.get('[data-cy="external"]')
    .focus()
    .realPress('Space')

    cy.wrap(urlStub).should('not.be.called')
    cy.wrap(fnStub).should('not.be.called')
  })
})
