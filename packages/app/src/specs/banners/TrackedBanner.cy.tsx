import TrackedBanner from './TrackedBanner.vue'
import { ref } from 'vue'
import { TrackedBanner_RecordShownDocument, TrackedBanner_RecordDismissedDocument } from '../../generated/graphql'

describe('<TrackedBanner />', () => {
  it('should pass through props and child content', () => {
    cy.mount({ render: () => <TrackedBanner bannerId="test-banner" dismissible modelValue={true}>Test Content</TrackedBanner> })

    cy.findByText('Test Content').should('be.visible')
    cy.findByTestId('alert-suffix-icon').should('be.visible')

    cy.percySnapshot()
  })

  it('should record when banner is made visible', () => {
    const recordStub = cy.stub()
    const shown = ref(true)

    cy.stubMutationResolver(TrackedBanner_RecordShownDocument, (defineResult, { bannerId }) => {
      recordStub(bannerId)

      return defineResult({ setBannerShown: true })
    })

    // Initially mount as visible
    // @ts-ignore
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} /> })

    cy.get('[data-cy="banner"]').as('banner')

    cy.get('@banner').should('be.visible')
    .then(() => {
      expect(recordStub).to.have.been.calledOnceWith('test-banner')

      shown.value = false
    })

    cy.get('@banner').should('not.exist')
    .then(() => {
      shown.value = true
    })

    cy.get('@banner').should('be.visible')
    .then(() => {
      expect(recordStub).to.have.been.calledTwice
      expect(recordStub).to.have.been.always.calledWith('test-banner')
    })
  })

  it('should record when banner is made visible', () => {
    const dismissStub = cy.stub()
    const shown = ref(true)

    cy.stubMutationResolver(TrackedBanner_RecordDismissedDocument, (defineResult, { bannerId }) => {
      dismissStub(bannerId)

      return defineResult({ setBannerDismissed: true })
    })

    // Initially mount as visible
    // @ts-ignore
    cy.mount({ render: () => <TrackedBanner data-cy="banner" bannerId="test-banner" v-model={shown.value} dismissible /> })

    cy.get('[data-cy="banner"]').as('banner')

    cy.get('@banner').should('be.visible')
    .then(() => {
      expect(dismissStub).not.to.have.been.called
    })

    cy.get('@banner').findByTestId('alert-suffix-icon').click()

    cy.get('@banner').should('not.exist')
    .then(() => {
      expect(dismissStub).to.have.been.calledOnce
      expect(dismissStub).to.have.been.calledWith('test-banner')
    })
  })
})
