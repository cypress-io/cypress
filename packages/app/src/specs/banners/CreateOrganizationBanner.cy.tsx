// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import CreateOrganizationBanner from './CreateOrganizationBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<CreateOrganizationBanner />', () => {
  const cohortOption = { cohort: '', value: defaultMessages.specPage.banners.createOrganization.title }

  it('should render expected content', () => {
    const linkHref = 'http://dummy.cypress.io/organizations/create'

    cy.gqlStub.Query.cloudViewer = {
      __typename: 'CloudUser',
      id: 'test123',
      cloudOrganizationsUrl: linkHref,
    } as any

    cy.mount({ render: () => <CreateOrganizationBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

    cy.contains(defaultMessages.specPage.banners.createOrganization.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.content).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.createOrganization.buttonLabel).should('be.visible')

    cy.get('a')
    .should('have.attr', 'href')
    .and('contain', linkHref)

    cy.percySnapshot()
  })

  context('events', () => {
    beforeEach(() => {
      const recordEvent = cy.stub().as('recordEvent')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })
    })

    it('should record expected event on mount', () => {
      cy.mount({ render: () => <CreateOrganizationBanner hasBannerBeenShown={false} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'Set up your organization',
        medium: 'Specs Create Organization Banner',
        messageId: Cypress.sinon.match.string,
        cohort: null,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount({ render: () => <CreateOrganizationBanner hasBannerBeenShown={true} cohortOption={cohortOption}/> })

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
