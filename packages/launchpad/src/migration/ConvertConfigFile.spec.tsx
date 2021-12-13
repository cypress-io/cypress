import ConvertConfigFile from './ConvertConfigFile.vue'

describe('<ConvertConfigFile/>', { viewportWidth: 1119 }, () => {
  it('renders expected content', () => {
    cy.mount(() => (<div class="p-16px">
      <ConvertConfigFile />
    </div>))
  })
})
