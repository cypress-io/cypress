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

    const copyOptions = [{ cohort: 'A', value: 'specPage.banners.createOrganization.titleA' }]

    cy.mount({ render: () => <CreateOrganizationBanner modelValue={true} headerCopyOptions={copyOptions}/> })

    cy.contains(defaultMessages.specPage.banners.createOrganization.titleA).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.buttonLabel).should('be.visible')

    cy.get('a')
    .should('have.attr', 'href')
    .and('contain', linkHref)

    cy.percySnapshot()
  })
})
