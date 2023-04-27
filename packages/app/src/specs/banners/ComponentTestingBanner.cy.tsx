import { defaultMessages } from '@cy/i18n'
import ComponentTestingBanner from './ComponentTestingBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<ComponentTestingBanner />', () => {
  it('should render expected content', () => {
    cy.mount(<ComponentTestingBanner hasBannerBeenShown={true} framework="react" />)
  })

  ;[
    { name: 'React', icon: 'react' },
    { name: 'Vue', icon: 'vue3' },
    { name: 'Angular', icon: 'angular' },
    { name: 'Next.js', icon: 'nextjs' },
  ].map((framework) => {
    it(`should render expected content for ${framework.name}`, () => {
      cy.mount(<ComponentTestingBanner hasBannerBeenShown={true} framework={framework} />)

      cy.findByTestId('framework-icon').should('be.visible')
      cy.contains(defaultMessages.specPage.banners.ct.title.replace('{0}', framework.name)).should('be.visible')
    })
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
      cy.mount(<ComponentTestingBanner hasBannerBeenShown={false} framework={{ name: 'React', icon: 'react' }} />)

      cy.get('@recordEvent').should('have.been.calledWith', {
        campaign: 'TODO',
        medium: 'TODO',
        messageId: Cypress.sinon.match.string,
        cohort: 'n/a',
      })
    })

    it('should not record event on mount if already shown', () => {
      cy.mount(<ComponentTestingBanner hasBannerBeenShown={true} framework={{ name: 'React', icon: 'react' }} />)

      cy.get('@recordEvent').should('not.have.been.called')
    })
  })
})
