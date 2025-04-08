import NoResults from './NoResults.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<NoResults />', () => {
  it('renders if there is a search message', () => {
    const testSearch = 'test search'
    const clearSpy = cy.spy().as('clearSpy')

    cy.mount(() => (
      <div><NoResults onClear={clearSpy} searchTerm={testSearch} /></div>
    ))

    cy.contains(testSearch).should('be.visible')
    cy.contains(defaultMessages.noResults.defaultMessage).should('be.visible')
    cy.contains('button', defaultMessages.noResults.clearSearch).should('be.visible')
    .click()
    .get('@clearSpy')
    .should('have.been.calledOnce')
  })

  it('does not render if there is no search message', () => {
    cy.mount(() => (
      <div><NoResults /></div>
    ))

    cy.contains(defaultMessages.noResults.defaultMessage).should('not.exist')
    cy.contains('button', defaultMessages.noResults.clearSearch).should('not.exist')
  })
})
