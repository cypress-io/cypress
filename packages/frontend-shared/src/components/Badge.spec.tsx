import Badge from './Badge.vue'

describe('<Badge />', () => {
  it('playground', { viewportWidth: 200, viewportHeight: 300 }, () => {
    cy.mount(() => (
      <div class="p-6 grid gap-2">
        <Badge status="success" label="Success" />
        <Badge status="error" label="Error" />
        <Badge status="disabled" label="Disabled" />
        <Badge status="warning" label="Warning" />
      </div>
    ))
  })
})
