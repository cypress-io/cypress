import { defaultMessages } from '@cy/i18n'
import WelcomeGuide from './WelcomeGuide.vue'

const welcomeGuide = defaultMessages.welcomeGuide.header

describe('<WelcomeGuide />', () => {
  it('should be dismissable when clicking on the Dismiss button', () => {
    cy.viewport(1200, 800)
    cy.mount(() => <div class="min-w-400px max-w-1100px resize-x overflow-auto"><WelcomeGuide /></div>)
    cy.findByText(welcomeGuide.title).should('be.visible')
    cy.findByText(welcomeGuide.description).should('be.visible')
    cy.findByText(defaultMessages.components.modal.dismiss).click()
    cy.findByText(welcomeGuide.title).should('not.exist')
    cy.findByText(welcomeGuide.description).should('not.exist')
  })

  it('renders', () => {
    cy.viewport(1200, 800)
    cy.mount(() => <div class="min-w-400px max-w-1100px resize-x overflow-auto"><WelcomeGuide /></div>)
  })
})
