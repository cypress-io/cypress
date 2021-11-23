import WizardLayout from './WizardLayout.vue'

describe('<WizardLayout />', () => {
  it('playground', { viewportWidth: 800, viewportHeight: 600 }, () => {
    cy.mount(() => (
      <WizardLayout title="title" description="description">
        <div class="h-20 border-jade-600 border flex items-center justify-center">
          content
        </div>
      </WizardLayout>
    ))
  })
})
