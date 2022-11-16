import DebugPageHeader from './DebugPageHeader.vue'

describe('<DebugPageHeader />', () => {
  it('mounts the debug header component', () => {
    cy.mount(DebugPageHeader)
  })
})
