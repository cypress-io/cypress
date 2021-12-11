import ResizablePanels from './ResizablePanels.vue'

describe('<ResizablePanels />', { viewportWidth: 2000 }, () => {
  it('playground', () => {
    cy.mount(<div class="h-screen"><ResizablePanels/></div>)
  })
})
