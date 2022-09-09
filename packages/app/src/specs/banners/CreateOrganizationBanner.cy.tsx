import { defaultMessages } from '@cy/i18n'
import CreateOrganizationBanner from './CreateOrganizationBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

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

  it('should record expected event on mount', () => {
    const recordEvent = cy.stub().as('recordEvent')

    cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
      recordEvent(event)

      return defineResult({ recordEvent: true })
    })

    cy.mount({ render: () => <CreateOrganizationBanner modelValue={true} hasBannerBeenShown={false} /> })

    cy.get('@recordEvent').should('have.been.calledWith', {
      campaign: 'Set up your organization',
      medium: 'Specs Create Organization Banner',
      messageId: Cypress.sinon.match.string,
      cohort: null,
    })
  })
})
