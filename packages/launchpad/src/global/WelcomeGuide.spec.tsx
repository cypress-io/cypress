import WelcomeGuide from './WelcomeGuide.vue'

describe('<WelcomeGuide />', () => {
  it('should render correctly', () => {
    cy.viewport(1200, 500)
    cy.mount(() => <div class="min-w-400px max-w-1100px resize-x overflow-auto"><WelcomeGuide /></div>)
  })
})
