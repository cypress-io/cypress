import WizardLayout from './WizardLayout.vue'

describe('<WizardLayout />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <WizardLayout>
        <div class="h-100 flex items-center justify-center">content</div>
      </WizardLayout>
    ))
  })
})
