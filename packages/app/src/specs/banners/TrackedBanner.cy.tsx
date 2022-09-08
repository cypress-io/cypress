import TrackedBanner from './TrackedBanner.vue'
import { ref } from 'vue'
import { TrackedBanner_RecordBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'

describe('<TrackedBanner />', () => {
  it('should pass through props and child content', () => {
    cy.mount({ render: () => <TrackedBanner bannerId="test-banner" dismissible modelValue={true} hasBannerBeenShown={false} eventData={{} as any}>Test Content</TrackedBanner> })

    cy.findByText('Test Content').should('be.visible')
    cy.findByTestId('alert-suffix-icon').should('be.visible')

    cy.percySnapshot()
  })

  it('should record when banner is made visible', () => {
    cy.clock(1234)
    const recordStub = cy.stub()
    const shown = ref(true)

    cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, { value }) => {
      recordStub(value)

      return defineResult({ setPreferences: {} as any })
    })

    // Initially mount as visible
    // @ts-ignore
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} hasBannerBeenShown={false} /> })

    cy.get('[data-cy="banner"]').as('banner')

    cy.get('@banner').should('be.visible')
    .then(() => {
      expect(recordStub).to.have.been.calledWith('{"banners":{"test-banner":{"lastShown":1234}}}')
    })
  })

  it('should record when banner is dismissed', () => {
    cy.clock(1234)
    const recordStub = cy.stub()
    const shown = ref(true)

    cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, { value }) => {
      recordStub(value)

      return defineResult({ setPreferences: {} as any })
    })

    // Initially mount as visible
    // @ts-ignore
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} dismissible hasBannerBeenShown={false} /> })

    cy.get('[data-cy="banner"]').as('banner')

    cy.get('@banner').should('be.visible')

    cy.get('@banner').findByTestId('alert-suffix-icon').click()

    cy.get('@banner').should('not.exist')
    .then(() => {
      expect(recordStub).to.have.been.calledWith('{"banners":{"test-banner":{"dismissed":1234}}}')
    })
  })

  describe('event recording', () => {
    beforeEach(() => {
      const recordEventStub = cy.stub().as('recordEvent')

      cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
        recordEventStub(event)

        return defineResult({ recordEvent: true })
      })
    })

    context('when banner not previously shown', () => {
      beforeEach(() => {
        cy.mount({
          render: () => <TrackedBanner bannerId="test-banner" modelValue={true} hasBannerBeenShown={false} eventData={{ campaign: 'CAM', medium: 'MED', cohort: 'COH' }} />,
        })
      })

      it('should record event', () => {
        cy.get('@recordEvent').should('have.been.calledOnce')
        cy.get('@recordEvent').should(
          'have.been.calledWith',
          Cypress.sinon.match({ campaign: 'CAM', messageId: Cypress.sinon.match.string, medium: 'MED', cohort: 'COH' }),
        )
      })

      it('should debounce event recording', () => {
        cy.wait(250)
        cy.get('@recordEvent').should('have.been.calledOnce')
      })
    })

    context('when banner has been previously shown', () => {
      beforeEach(() => {
        cy.mount({ render: () => <TrackedBanner bannerId="test-banner" modelValue={true} hasBannerBeenShown={true} eventData={{} as any} /> })
      })

      it('should not record event', () => {
        cy.get('@recordEvent').should('not.have.been.called')
      })
    })
  })
})
