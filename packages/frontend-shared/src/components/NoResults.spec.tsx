import NoResuts from './NoResults.vue'
import { defaultMessages } from '@cy/i18n'

describe('<NoResults />', () => {
  it('renders if there is a search message', () => {
    const testSearch = 'test search'

    cy.mount(() => (
      <div><NoResuts search={testSearch} /></div>
    ))

    cy.contains(testSearch).should('be.visible')
    cy.contains(defaultMessages.noResults.defaultMessage).should('be.visible')
    cy.contains('button', defaultMessages.noResults.clearSearch).should('be.visible')
    .click()
    .vue(NoResuts).then((wrapper) => {
      cy.wrap(wrapper.emitted('clear')).should('have.length', 1)
    })
  })

  it('does not render if there is no search message', () => {
    cy.mount(() => (
      <div><NoResuts /></div>
    ))

    cy.contains(defaultMessages.noResults.defaultMessage).should('not.exist')
    cy.contains('button', defaultMessages.noResults.clearSearch).should('not.exist')
  })
})
