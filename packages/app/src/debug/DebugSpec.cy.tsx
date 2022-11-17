import DebugSpec from './DebugSpec.vue'

describe('<DebugSpec/>', () => {
  it('mounts correctly', () => {
    cy.mount(() => (<DebugSpec/>))
  })
})
