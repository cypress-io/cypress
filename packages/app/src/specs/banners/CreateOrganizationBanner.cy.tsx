import { defaultMessages } from '@cy/i18n'
import CreateOrganizationBanner from './CreateOrganizationBanner.vue'

describe('<CreateOrganizationBanner />', () => {
  it('should render expected content', () => {
    const linkHref = 'http://dummy.cypress.io/organizations/create'

    cy.gqlStub.Query.cloudViewer = {
      __typename: 'CloudUser',
      id: 'test123',
      cloudOrganizationsUrl: linkHref,
    } as any

    cy.mount({ render: () => <CreateOrganizationBanner modelValue={true} /> })

    cy.contains(defaultMessages.specPage.banners.createOrganization.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.buttonLabel).should('be.visible')

    cy.get('a')
    .should('have.attr', 'href')
    .and('contain', linkHref)

    cy.percySnapshot()
  })
})
