import SetupComponentTesting from './SetupComponentTesting.vue'

describe('<RenameSpecsManual/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-[16px]">
      <SetupComponentTesting />
    </div>))
  })
})
