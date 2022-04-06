import ExternalLink from './ExternalLink.vue'
import { ExternalLink_OpenExternalDocument } from '../generated/graphql'

describe('<ExternalLink />', () => {
  beforeEach(() => {
    const onClickSpy = cy.spy().as('onClickSpy')

    cy.mount(() => (
      <ExternalLink
        href='https://on.cypress.io/ci'
        // @ts-ignore - vue @click isn't represented in JSX
        onClick={onClickSpy}
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

    cy.contains('a', 'Click me!')
    .click()

    cy.wrap(urlStub).should('have.been.calledWith', 'https://on.cypress.io/ci')
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('opens external link on enter', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.contains('a', 'Click me!')
    .focus()
    .realPress('Enter')

    cy.wrap(urlStub).should('have.been.calledWith', 'https://on.cypress.io/ci')
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('opens external link on click and enter', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.contains('a', 'Click me!')
    .click()
    .realPress('Enter')

    cy.wrap(urlStub).should('have.been.calledTwice')
    cy.get('@onClickSpy').should('have.been.calledTwice')
  })

  it('do not open external link on space bar trigger', () => {
    const urlStub = cy.stub()

    cy.stubMutationResolver(ExternalLink_OpenExternalDocument, (defineResult, { url }) => {
      urlStub(url)

      return defineResult({
        openExternal: true,
      })
    })

    cy.contains('a', 'Click me!')
    .focus()
    .realPress('Space')

    cy.wrap(urlStub).should('not.be.called')
    cy.get('@onClickSpy').should('not.be.called')
  })
})
