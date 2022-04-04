import ExternalLink from './ExternalLink.vue'
import { ExternalLink_OpenExternalDocument } from '../generated/graphql'

describe('<ExternalLink />', () => {
  it('opens external link on click', () => {
    cy.mount(() => (<>
      <ExternalLink href='https://on.cypress.io/ci'>
        Click me!
      </ExternalLink>
    </>))

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
  })

  it('opens external link on enter', () => {
    cy.mount(() => (<>
      <ExternalLink href='https://on.cypress.io/ci'>
        Click me!
      </ExternalLink>
    </>))

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
    cy.mount(() => (<>
      <ExternalLink href='https://on.cypress.io/ci'>
        Click me!
      </ExternalLink>
    </>))

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
  })

  it('do not open external link on space bar trigger', () => {
    cy.mount(() => (<>
      <ExternalLink href='https://on.cypress.io/ci'>
        Click me!
      </ExternalLink>
    </>))

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
  })
})
