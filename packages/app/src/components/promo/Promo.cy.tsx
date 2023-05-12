import Promo from './Promo.vue'
import PromoCard from './PromoCard.vue'
import PromoAction from './PromoAction.vue'
import PromoHeader from './PromoHeader.vue'
import { IconActionRestart, IconChevronRightSmall } from '@cypress-design/vue-icon'
import { Promo_PromoSeenDocument } from '../../generated/graphql-test'

describe('<Promo />', () => {
  const renderPromo = () => {
    const recordEvent = cy.stub().as('recordEvent')

    cy.stubMutationResolver(Promo_PromoSeenDocument, (defineResult, args) => {
      recordEvent(args)

      return defineResult({ recordEvent: true })
    })

    cy.mount(
      <Promo
        campaign="_campaign_"
        medium="_medium_"
      >
        {{
          header: () => (
            <PromoHeader title="Title!">
              {{
                description: () => (
                  <h2>Description...</h2>
                ),
                content: () => (
                  <p>_content_</p>
                ),
              }}
            </PromoHeader>
          ),
          cards: ({ step, goForward, reset }) => {
            if (step === 0) {
              return (
                <PromoCard
                  title="Card #1"
                  body="Card Description"
                >
                  {{
                    image: () => (
                      <div>Image</div>
                    ),
                    action: () => (
                      <PromoAction
                        action={goForward}
                        left-label="1 of 2"
                        right-label="Next"
                        right-icon={IconChevronRightSmall}
                      />
                    ),
                  }}
                </PromoCard>
              )
            }

            if (step === 1) {
              return (
                <PromoCard
                  title="Card #2"
                  body="Card Description"
                >
                  {{
                    image: () => (
                      <div>Image</div>
                    ),
                    action: () => (
                      <PromoAction
                        action={reset}
                        right-label="Reset"
                        left-icon={IconActionRestart}
                      />
                    ),
                  }}
                </PromoCard>
              )
            }

            return null
          },
        }}
      </Promo>,
    )
  }

  beforeEach(() => {
    renderPromo()
  })

  it('renders properly on narrow viewport', { viewportWidth: 600 }, () => {
    cy.percySnapshot()
  })

  it('renders properly on wide viewport', { viewportWidth: 1280 }, () => {
    cy.percySnapshot()
  })

  it('records event on initial render', () => {
    cy.get('@recordEvent').should('have.been.calledOnce')
    cy.get('@recordEvent').should('have.been.calledWith', {
      campaign: '_campaign_',
      medium: '_medium_',
      cohort: null,
      messageId: Cypress.sinon.match.string,
    })
  })

  describe('controls', () => {
    it('handles `goForward`', () => {
      cy.contains('Card #1').should('be.visible')
      cy.findByTestId('promo-action-control').click()
      cy.contains('Card #2').should('be.visible')
    })

    it('handles `reset`', () => {
      cy.findByTestId('promo-action-control').click()
      cy.contains('Card #2').should('be.visible')
      cy.findByTestId('promo-action-control').should('contain.text', 'Reset')
      cy.findByTestId('promo-action-control').click()
      cy.contains('Card #1').should('be.visible')
    })
  })
})
