import DebugPageHeader from './DebugPageHeader.vue'

describe('<DebugPageHeader />', {
  viewportHeight: 1000,
  viewportWidth: 1032,
},
() => {
  it('mounts the debug header component', () => {
    cy.mount(DebugPageHeader)
  })
})
