import ResizablePanels from './ResizablePanels.vue'

const panelSlots = {
  panel1: () => <div class="h-full bg-green-200">Panel 1</div>,
  panel2: () => <div class="h-full bg-purple-200">Panel 2</div>,
  panel3: () => <div class="flex-grow h-full bg-gray-200">Panel 3</div>,
}

const defaultPanel1Width = 280
const defaultPanel2Width = 320

describe('<ResizablePanels />', { viewportWidth: 1500, defaultCommandTimeout: 100 }, () => {
  it('playground with default slot and props', () => {
    cy.mount(() => <div class="h-screen"><ResizablePanels/></div>)
  })

  it('the slots render', () => {
    cy.mount(() => (<div class="h-screen"><ResizablePanels
      v-slots={panelSlots}
    /> </div>))

    cy.contains('Panel 1').should('be.visible')
    cy.contains('Panel 2').should('be.visible')
    cy.contains('Panel 3').should('be.visible')
  })

  it('the first panel can be resized', () => {
    cy.mount(() => (
      <div class="h-screen">
        <ResizablePanels
          v-slots={panelSlots}
        />
      </div>))

    cy.contains('Panel 1').as('panel1')

    cy.get('@panel1').invoke('outerWidth').should('eq', defaultPanel1Width)

    cy.get('[data-cy="panel1ResizeHandle"]').trigger('mousedown')
    .trigger('mousemove', { clientX: 500 })
    .trigger('mouseup')

    cy.get('@panel1').invoke('outerWidth').should('eq', 500)

    cy.get('[data-cy="panel1ResizeHandle"]').trigger('mousedown')
    .trigger('mousemove', { clientX: 400 })
    .trigger('mouseup')

    cy.get('@panel1').invoke('outerWidth').should('eq', 400)
  })

  it('the second panel can be resized', () => {
    cy.mount(() => (
      <div class="flex">
        <div class='bg-green-600 text-white w-64px'>sidebar</div>
        <div class="flex-grow h-screen"><ResizablePanels
          v-slots={panelSlots}
        />
        </div>
      </div>))

    cy.contains('Panel 2').as('panel2')

    cy.get('@panel2').invoke('outerWidth').should('eq', defaultPanel2Width)

    cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown')
    .trigger('mousemove', { clientX: 1000 })
    .trigger('mouseup')

    cy.get('@panel2').invoke('outerWidth').should('eq', 720)

    cy.get('[data-cy="panel2ResizeHandle"]').trigger('mousedown')
    .trigger('mousemove', { clientX: 750 })
    .trigger('mouseup')

    cy.get('@panel2').invoke('outerWidth').should('eq', 470)
  })
})

//
// showPanel1: true,
// showPanel2: true,
// initialPanel1Width: 280,
// initialPanel2Width: 320,
// minPanel1Width: 200,
// minPanel2Width: 200,
// minPanel3Width: 100,
// maxTotalWidth: window.innerWidth,
