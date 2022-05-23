import Badge, { statusClassesObject } from './Badge.vue'

describe('<Badge />', () => {
  it('playground', { viewportWidth: 100, viewportHeight: 300 }, () => {
    cy.mount(() => (
      <div class="text-center p-4">
        <Badge status="success" label="Success" />
        <Badge status="warning" label="Warning" />
        <Badge status="error" label="Error" />
        <Badge status="disabled" label="Disabled" />
        <Badge status="skipped" label="Skipped" />
      </div>
    ))

    const labelList = ['Success', 'Warning', 'Error', 'Disabled', 'Skipped']

    // confirm that the intended mapping between status and classes is used for each status
    cy.wrap(labelList).each((label: string) => {
      cy.contains(label)
      .should('be.visible')
      .and('have.class', statusClassesObject[label.toLowerCase()])
    })

    cy.percySnapshot()
  })
})
