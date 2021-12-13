import ResizablePanels from './ResizablePanels.vue'

const panelSlots = {
  panel1: () => <div class="h-full bg-emerald-100">panel1</div>,
  panel2: () => <div class="h-full bg-purple-300">panel2</div>,
  panel3: () => <div class="flex-grow h-full bg-indigo-100">panel3</div>,
}

const defaultPanel1Width = 280
const defaultPanel2Width = 320

const dragHandleToClientX = (panel: 'panel1' | 'panel2', x: number) => {
  cy.get(`[data-cy="${panel}ResizeHandle"]`).trigger('mousedown', { eventConstructor: 'MouseEvent' })
  .trigger('mousemove', { clientX: x })
  .trigger('mouseup', { eventConstructor: 'MouseEvent' })
}

const assertWidth = (panel: 'panel1' | 'panel2' | 'panel3', width: number) => {
  cy.contains(panel).invoke('outerWidth').should('eq', width)
}

describe('<ResizablePanels />', { viewportWidth: 1500, defaultCommandTimeout: 4000 }, () => {
  const minPanel1Width = 100
  const minPanel2Width = 100
  const minPanel3Width = 500

  it('playground with default slot and props', () => {
    cy.mount(() => <div class="h-screen"><ResizablePanels/></div>)
  })

  it('the panels can be resized', () => {
    cy.mount(() => (
      <div class="h-screen">
        <ResizablePanels
          maxTotalWidth={1500}
          v-slots={panelSlots}
        />
      </div>))

    assertWidth('panel1', defaultPanel1Width)
    dragHandleToClientX('panel1', 500)
    assertWidth('panel1', 500)
    dragHandleToClientX('panel1', 400)
    assertWidth('panel1', 400)

    assertWidth('panel2', defaultPanel2Width)
    dragHandleToClientX('panel2', 800)
    assertWidth('panel2', 400)
    dragHandleToClientX('panel2', 700)
    assertWidth('panel2', 300)
  })

  it('the minium values are respected across a range of user actions', () => {
    cy.mount(() => (
      <div class="h-screen">
        <ResizablePanels
          maxTotalWidth={1500}
          v-slots={panelSlots}
          minPanel1Width={minPanel1Width}
          minPanel2Width={minPanel2Width}
          minPanel3Width={minPanel3Width}
        />
      </div>))

    // drag panel 1 to its minimum width and attempt to go below it
    assertWidth('panel1', defaultPanel1Width)
    dragHandleToClientX('panel1', 100)
    dragHandleToClientX('panel1', 99)
    assertWidth('panel1', minPanel1Width)
    dragHandleToClientX('panel1', 50)
    assertWidth('panel1', minPanel1Width)

    // drag panel 2 to its minimum width and attempt to go below it
    assertWidth('panel2', defaultPanel2Width)
    dragHandleToClientX('panel2', 200)
    dragHandleToClientX('panel2', 199)
    assertWidth('panel2', minPanel2Width)
    dragHandleToClientX('panel2', 50)
    assertWidth('panel2', minPanel2Width)

    // panels 1 and 2 are at the minimum of 100 each,
    // so panel 3 should be 1300px wide
    assertWidth('panel3', 1300)

    // drag panel 1 to its maximum width
    // this should compress panel 3 to its minimum
    // and have no effect on panel 2
    dragHandleToClientX('panel1', 900)
    assertWidth('panel3', minPanel3Width)
    dragHandleToClientX('panel1', 901)
    assertWidth('panel3', minPanel3Width)
    dragHandleToClientX('panel1', 1000)
    assertWidth('panel3', minPanel3Width)
    assertWidth('panel2', minPanel2Width)

    // even though we attempted to drag it beyond 900px
    // panel 1 should not have gotten wider
    assertWidth('panel1', 900)

    // now we reduce the size of panel 1 so that we can
    // expand panel 2, and make sure it does not
    // allow expanding so much that it shrinks panel 3
    // below the minimum
    dragHandleToClientX('panel1', 700)
    assertWidth('panel3', 700)
    assertWidth('panel2', minPanel2Width)
    assertWidth('panel1', 700)
    dragHandleToClientX('panel2', 1000)
    assertWidth('panel2', 300)
    assertWidth('panel3', minPanel3Width)
    dragHandleToClientX('panel2', 1200)

    // attempting to drag the handle of panel 2 from 1000px
    // to 1200px should have no effect on the size of anything
    assertWidth('panel1', 700)
    assertWidth('panel2', 300)
    assertWidth('panel3', minPanel3Width)
  })

  it('handles being offset by some distance on the left', () => {
    cy.mount(() => (
      <div class="flex">
        <div class='bg-green-600 text-white w-100px'>sidebar</div>
        <div class="flex-grow h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={panelSlots}
            offsetLeft={100}
          />
        </div>
      </div>))

    assertWidth('panel1', defaultPanel1Width)
    assertWidth('panel2', defaultPanel2Width)
    dragHandleToClientX('panel1', 400)
    assertWidth('panel1', 300)
    dragHandleToClientX('panel1', 300)
    assertWidth('panel1', 200)

    dragHandleToClientX('panel2', 600)
    assertWidth('panel2', 300)
    dragHandleToClientX('panel2', 580)
    assertWidth('panel2', 280)
  })
})
