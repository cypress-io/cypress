import RenameSpecsAuto from './RenameSpecsAuto.vue'

describe('RenameSpecsAuto', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-16px">
      <RenameSpecsAuto />
    </div>))
  })
})
