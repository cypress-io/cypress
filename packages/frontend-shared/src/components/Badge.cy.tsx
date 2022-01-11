import Badge from './Badge.vue'

describe('<Badge />', () => {
  it('playground', { viewportWidth: 100, viewportHeight: 300 }, () => {
    cy.mount(() => (
      <div class="p-4 text-center">
        <Badge status="success" label="Success" />
        <Badge status="warning" label="Warning" />
        <Badge status="error" label="Error" />
        <Badge status="disabled" label="Disabled" />
        <Badge status="skipped" label="Skipped" />
      </div>
    ))
  })
})
