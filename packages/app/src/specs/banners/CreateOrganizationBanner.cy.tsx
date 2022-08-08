import CreateOrganizationBanner from './CreateOrganizationBanner.vue'

describe('<CreateOrganizationBanner />', () => {
  it('should render expected content', () => {
    const linkHref = 'http://dummy.cypress.io/organization/create'

    cy.gqlStub.Query.cloudViewer = {
      __typename: 'CloudUser',
      id: 'test123',
      createCloudOrganizationUrl: linkHref,
    } as any

    cy.mount({ render: () => <CreateOrganizationBanner modelValue={true} /> })

    cy.get('a').should('have.attr', 'href', linkHref)

    cy.percySnapshot()
  })
})
