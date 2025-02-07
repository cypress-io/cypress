import WizardLayout from './WizardLayout.vue'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'

describe('<WizardLayout />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <WizardLayout>
        <div class="h-20 border-jade-600 border flex items-center justify-center">
          content
        </div>
      </WizardLayout>
    ))
  })

  it('renders buttons with default text', () => {
    const nextFn = () => {}
    const backFn = () => {}
    const skipFn = () => {}

    cy.mount(() => (
      <WizardLayout backFn={backFn} nextFn={nextFn} skipFn={skipFn}>
        <div class="h-20 border-jade-600 border flex items-center justify-center">
          content
        </div>
      </WizardLayout>
    ))

    cy.contains('button', defaultMessages.setupPage.step.next).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.skip).should('be.visible')
  })

  it('renders buttons with custom text', () => {
    const nextFn = () => {}
    const next = 'Custom next'

    const backFn = () => {}
    const back = 'Custom back'

    const skipFn = () => {}
    const skip = 'Custom skip'

    cy.mount(() => (
      <WizardLayout backFn={backFn} back={back} nextFn={nextFn} next={next} skipFn={skipFn} skip={skip}>
        <div class="h-20 border-jade-600 border flex items-center justify-center">
          content
        </div>
      </WizardLayout>
    ))

    cy.contains('button', next).should('be.visible')
    cy.contains('button', back).should('be.visible')
    cy.contains('button', skip).should('be.visible')
  })

  it('renders accessory slot', () => {
    cy.mount(() => (
      <WizardLayout>
        {{
          default: () => (
            <div class="h-20 border-jade-600 border flex items-center justify-center">
              content
            </div>
          ),
          accessory: () => <span>Accessory Content</span>,
        }}
      </WizardLayout>
    ))

    cy.contains('Accessory Content').should('be.visible')
  })
})
