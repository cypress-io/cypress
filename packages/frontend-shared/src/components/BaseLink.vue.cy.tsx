import BaseLink from './BaseLink.vue'

describe('<BaseLink />', () => {
  it('renders with default styles', { viewportWidth: 100, viewportHeight: 60 }, () => {
    cy.mount(() => (
      <BaseLink
        href="http://test.test"
      >Test Link</BaseLink>
    ))

    cy.get('a').should('have.class', 'text-indigo-500')
    cy.get('a').should('have.class', 'hocus-link-default')
  })

  it('allows opt out default styles', { viewportWidth: 100, viewportHeight: 60 }, () => {
    cy.mount(() => (
      <BaseLink
        href="http://test.test"
        useDefaultHocus={false}
        class="text-blue-500"
      >Test Link</BaseLink>
    ))

    cy.get('a')
    .should('not.have.class', 'text-indigo-500')
    .and('not.have.class', 'text-indigo-500')
    .and('have.class', 'text-blue-500')
  })
})
