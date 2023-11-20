import TrackedBanner from './TrackedBanner.vue'
import { ref, reactive } from 'vue'
import { TrackedBanner_RecordBannerSeenDocument, TrackedBanner_SetProjectStateDocument } from '../../generated/graphql'

describe('<TrackedBanner />', () => {
  it('should pass through props and child content', () => {
    cy.mount({ render: () => <TrackedBanner bannerId="test-banner" dismissible hasBannerBeenShown={false} eventData={{} as any}>Test Content</TrackedBanner> })

    cy.findByText('Test Content').should('be.visible')
    cy.findByTestId('alert-suffix-icon').should('be.visible')
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
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} hasBannerBeenShown={false} eventData={{} as any}/> })

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
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} dismissible hasBannerBeenShown={false} eventData={{} as any} /> })

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
      let eventData

      beforeEach(() => {
        const setProjectStateStub = cy.stub().as('setProjectState')
        const hasBannerBeenShown = ref(false)

        // mock setting the project state which would reactively set the hasBannerBeenShown ref
        cy.stubMutationResolver(TrackedBanner_SetProjectStateDocument, (defineResult, event) => {
          setProjectStateStub(event)
          const preference = JSON.parse(event.value)

          expect(preference).to.have.nested.property('banners.test-banner.lastShown')
          hasBannerBeenShown.value = true

          return defineResult({ setPreferences: null }) // do not care about return value here
        })

        eventData = reactive({ campaign: 'CAM', medium: 'MED', cohort: 'COH' })

        cy.mount({
          render: () => <TrackedBanner bannerId="test-banner" hasBannerBeenShown={hasBannerBeenShown.value} eventData={eventData} />,
        })
      })

      it('should record event', () => {
        eventData.cohort = 'COH2' //Change reactive variable to confirm the record event is not recorded a second time
        cy.get('@recordEvent').should(
          'have.been.calledOnceWith',
          Cypress.sinon.match({ campaign: 'CAM', messageId: Cypress.sinon.match.string, medium: 'MED', cohort: 'COH' }),
        )
      })

      it('should debounce event recording', () => {
        eventData.cohort = 'COH'
        cy.wait(250)
        cy.get('@recordEvent').should('have.been.calledOnce')
      })
    })

    context('when banner has been previously shown', () => {
      let eventData

      beforeEach(() => {
        eventData = reactive({ campaign: 'CAM', medium: 'MED', cohort: undefined })
        cy.mount({ render: () => <TrackedBanner bannerId="test-banner" hasBannerBeenShown={true} eventData={eventData} /> })
      })

      it('should not record event', () => {
        eventData.cohort = 'COH'
        cy.get('@recordEvent').should('not.have.been.called')
      })
    })

    context('when eventData is undefined', () => {
      it('should not record event', () => {
        cy.mount({
          render: () => <TrackedBanner bannerId="test-banner" hasBannerBeenShown={false} eventData={undefined} />,
        })

        cy.get('@recordEvent').should('not.have.been.called')
      })
    })
  })
})
