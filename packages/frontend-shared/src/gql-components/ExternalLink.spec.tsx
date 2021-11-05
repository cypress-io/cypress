import ExternalLink from './ExternalLink.vue'

describe('<ExternalLink />', () => {
  // Actually opening links externally is tested via E2E tests in App and Launchpad

  it('renders with default styles', { viewportWidth: 100, viewportHeight: 60 }, () => {
    cy.mount(() => (
      <ExternalLink
        href="http://test.test"
      >Test Link</ExternalLink>
    ))

    cy.get('a')
    .should('have.class', 'text-indigo-500 hocus-link-default')
  })

  it('allows opt out default styles', { viewportWidth: 100, viewportHeight: 60 }, () => {
    cy.mount(() => (
      <ExternalLink
        href="http://test.test"
        useDefaultHocus={false}
        class="text-blue-500"
      >Test Link</ExternalLink>
    ))

    cy.get('a')
    .should('not.have.class', 'text-indigo-500')
    .and('not.have.class', 'text-indigo-500')
    .and('have.class', 'text-blue-500')
  })
})
