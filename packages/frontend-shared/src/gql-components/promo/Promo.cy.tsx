import Promo from './Promo.vue'
import PromoCard from './PromoCard.vue'
import PromoAction from './PromoAction.vue'
import PromoHeader from './PromoHeader.vue'
import { IconActionRestart, IconChevronRightSmall } from '@cypress-design/vue-icon'

describe('<Promo />', () => {
  const renderPromo = () => {
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

  it('renders properly on wide viewport', { viewportWidth: 1200 }, () => {
    cy.percySnapshot()
  })

  describe('controls', () => {
    it('handles `goForward`', () => {
      cy.contains('Card #1').should('be.visible')
      cy.findAllByTestId('promo-action').first().click()
      cy.contains('Card #2').should('be.visible')
    })

    it('handles `reset`', () => {
      cy.findAllByTestId('promo-action').first().click()
      cy.contains('Card #2').should('be.visible')
      cy.findAllByTestId('promo-action').first().should('contain.text', 'Reset')
      cy.findAllByTestId('promo-action').first().click()
      cy.contains('Card #1').should('be.visible')
    })
  })
})
