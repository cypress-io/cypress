import ResizablePanels from './ResizablePanels.vue'
import type { ResizablePanelName, DraggablePanel } from './useRunnerStyle'
import { runnerConstants } from './runner-constants'

// default values
const defaultPanel1Width = runnerConstants.defaultSpecListWidth
const defaultPanel2Width = runnerConstants.defaultReporterWidth
const minPanel1Width = 100
const minPanel2Width = 100
const minPanel3Width = 500

// helpers
const assertWidth = (panel: ResizablePanelName, width: number) => {
  cy.contains(panel).invoke('outerWidth').should('eq', width)
}

const dragHandleToClientX = (panel: DraggablePanel, x: number) => {
  cy.get(`[data-cy="${panel}ResizeHandle"]`).trigger('mousedown', { eventConstructor: 'MouseEvent' })
  .trigger('mousemove', { clientX: x })
  .trigger('mouseup', { eventConstructor: 'MouseEvent' })
}

// slot content
const slotContents = {
  panel1: () => <div class="h-full bg-emerald-100">panel1</div>,
  panel2: () => <div class="h-full bg-purple-300">panel2</div>,
  panel3: () => <div class="grow h-full bg-indigo-100">panel3</div>,
  panel4: () => <div class="h-full bg-yellow-100">panel4</div>,
}

describe('<ResizablePanels />', { viewportWidth: 1500, defaultCommandTimeout: 4000 }, () => {
  describe('the panels resize as expected', () => {
    beforeEach(() => {
      cy.mount(() => (
        <div class="h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={slotContents}
            initialPanel1Width={defaultPanel1Width}
            initialPanel2Width={defaultPanel2Width}
            minPanel1Width={minPanel1Width}
            minPanel2Width={minPanel2Width}
            minPanel3Width={minPanel3Width}
          />
        </div>))
    })

    it('the panels can be resized', () => {
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

    it('panel 1 can be resized between its minimum allowed width and maximum available space', () => {
      // drag panel 1 to its minimum width and attempt to go below it
      assertWidth('panel1', defaultPanel1Width)
      dragHandleToClientX('panel1', 100)
      dragHandleToClientX('panel1', 99)
      assertWidth('panel1', minPanel1Width)
      dragHandleToClientX('panel1', 50)
      assertWidth('panel1', minPanel1Width)

      // drag panel 1 to the maximum space available and attempt to go above it
      dragHandleToClientX('panel1', 550)
      dragHandleToClientX('panel1', 561)
      assertWidth('panel1', 550)
      dragHandleToClientX('panel1', 700)
      assertWidth('panel1', 550)

      // panel 2 was not reduced
      assertWidth('panel2', defaultPanel2Width)

      // panel 3 reached its minimum allowed size
      assertWidth('panel3', minPanel3Width)
    })

    it('panel 2 can be resized between its minimum allowed width and maximum available space', () => {
      // drag panel 2 to its minimum width and attempt to go below it
      assertWidth('panel2', defaultPanel2Width)
      dragHandleToClientX('panel2', 380)
      dragHandleToClientX('panel2', 279)
      assertWidth('panel2', minPanel2Width)
      dragHandleToClientX('panel2', 50)
      assertWidth('panel2', minPanel2Width)

      // drag panel 2 to the maximum space available and attempt to go above it
      dragHandleToClientX('panel2', 1000)
      dragHandleToClientX('panel2', 1001)
      assertWidth('panel2', 720)
      dragHandleToClientX('panel2', 1100)
      assertWidth('panel2', 720)

      // panel 1 was not reduced
      assertWidth('panel1', defaultPanel1Width)

      // panel 3 reached its minimum allowed size
      assertWidth('panel3', minPanel3Width)
    })
  })

  describe('when there is a side nav', () => {
    it('handles being offset by some distance on the left', () => {
      cy.mount(() => (
        <div class="flex">
          <div class='bg-green-600 text-white w-[100px]'> 100px wide sidebar</div>
          <div class="grow h-screen">
            <ResizablePanels
              maxTotalWidth={1500}
              v-slots={slotContents}
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
      dragHandleToClientX('panel2', 590)
      assertWidth('panel2', 290)
    })
  })

  describe('when panels are hidden', () => {
    it('panel 1 can be hidden with a prop', () => {
      cy.mount(() => (
        <div class="h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={slotContents}
            showPanel1={false}
          />
        </div>))

      cy.contains('panel1').should('not.be.visible')
      assertWidth('panel2', defaultPanel2Width)
      dragHandleToClientX('panel2', 1000)
      assertWidth('panel2', 1000)
      assertWidth('panel3', 500)
    })

    it('panel 2 can be hidden with a prop', () => {
      cy.mount(() => (
        <div class="h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={slotContents}
            showPanel2={false}
          />
        </div>))

      cy.contains('panel2').should('not.be.visible')
      assertWidth('panel1', defaultPanel1Width)
      dragHandleToClientX('panel1', 950)
      dragHandleToClientX('panel1', 955)
      assertWidth('panel1', 950)
      assertWidth('panel3', 550)
    })

    it('Panel 3 resizes correctly when all panels are hidden', () => {
      cy.mount(() => (
        <div class="h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={slotContents}
            showPanel1={false}
            showPanel2={false}
          />
        </div>))

      cy.contains('panel1').should('not.be.visible')
      cy.contains('panel2').should('not.be.visible')
      assertWidth('panel3', 1500)
    })

    it('Panel 3 resizes correctly when panels 1 and 2 are hidden and panel 4 is shown', () => {
      cy.mount(() => (
        <div class="h-screen">
          <ResizablePanels
            maxTotalWidth={1500}
            v-slots={slotContents}
            showPanel1={false}
            showPanel2={false}
            showPanel4={true}
          />
        </div>))

      cy.contains('panel1').should('not.be.visible')
      cy.contains('panel2').should('not.be.visible')
      cy.contains('panel4').should('be.visible')
      assertWidth('panel3', 1200)
    })
  })
})
