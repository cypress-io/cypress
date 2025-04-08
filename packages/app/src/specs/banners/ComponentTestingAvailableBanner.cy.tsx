// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import ComponentTestingAvailableBanner from './ComponentTestingAvailableBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'
import type Sinon from 'sinon'

const frameworks = [
  { name: 'React', type: 'react' },
  { name: 'Vue', type: 'vue3' },
  { name: 'Angular', type: 'angular' },
  { name: 'Next.js', type: 'nextjs' },
  { name: 'Svelte.js', type: 'svelte' },
]

describe('<ComponentTestingBanner />', { viewportWidth: 1200 }, () => {
  it('should render expected content', () => {
    cy.mount(<ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={frameworks[0]} machineId="abc" />)
  })

  frameworks.map((framework) => {
    it(`should render expected content for ${framework.name}`, () => {
      cy.mount(
        <ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={framework} machineId="abc" />,
      )

      cy.findByTestId('alert-prefix-icon').should('be.visible')
      cy.contains(defaultMessages.specPage.banners.componentTesting.title.replace('{0}', framework.name)).should('be.visible')
    })
  })

  context('events', () => {
    beforeEach(() => {
      const recordEvent = cy.stub().as('recordEvent')
      const setPrefs = cy.stub().as('setPrefs')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEvent(event)

        return defineResult({ recordEvent: true })
      })

      cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, event) => {
        setPrefs(event)

        return defineResult({ __typename: 'Mutation', setPreferences: { __typename: 'Query' } as any })
      })
    })

    it('should record expected event on mount', () => {
      cy.mount(
        <ComponentTestingAvailableBanner hasBannerBeenShown={false} framework={frameworks[0]} machineId="abc" />,
      )

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'CT Available',
        medium: 'Specs CT Available Banner',
        messageId: Cypress.sinon.match.string,
        cohort: null,
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount(
        <ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={frameworks[0]} machineId="abc" />,
      )

      cy.get('@recordEvent').should('not.have.been.called')
    })

    it('should record dismissal event when clicking survey link', () => {
      cy.mount(
        <ComponentTestingAvailableBanner hasBannerBeenShown={true} framework={frameworks[0]} machineId="abc" />,
      )

      cy.findByTestId('survey-link').click()

      cy.get('@setPrefs').should('have.been.calledTwice')
      cy.get('@setPrefs').should(($stub) => {
        const arg = ($stub as unknown as Sinon.SinonStub).getCall(1).args[0]

        expect(arg.value).to.contain('ct_052023_available')
        expect(arg.value).to.contain('dismissed')
      })
    })
  })
})
