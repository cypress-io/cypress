import Tooltip from './Tooltip.vue'
import Button from './Button.vue'

const slotContents = (x: number) => ({
  popper: () => <span>Tooltip {x}</span>,
  default: () => <span class={`default-slot${x}`}>hello</span>,
})

describe('<Tooltip />', () => {
  it('playground', () => {
    cy.mount(() => {
      return (
        <div class="p-4 w-[100px]">
          <Tooltip v-slots={slotContents(0)} placement="right" />
        </div>
      )
    })

    cy.get('.default-slot0')
    .realHover()

    cy.contains('Tooltip 0')
  })

  it('playground - interactive', { viewportHeight: 400 }, () => {
    cy.mount(() => {
      return (
        <div class="flex m-[100px] p-4 w-[100px] gap-[160px]">
          <Tooltip v-slots={slotContents(0)} placement="bottom" isInteractive />
          <Tooltip v-slots={slotContents(1)} placement="top" isInteractive />
          <Tooltip v-slots={slotContents(2)} placement="left" isInteractive />
          <Tooltip v-slots={slotContents(3)} placement="right" isInteractive />
        </div>
      )
    })

    cy.get('.default-slot0')
    .realHover()

    cy.contains('Tooltip 0')

    cy.get('.default-slot1')
    .realHover()

    cy.contains('Tooltip 1')

    cy.get('.default-slot2')
    .realHover()

    cy.contains('Tooltip 2')

    cy.get('.default-slot3')
    .realHover()

    cy.contains('Tooltip 3')
  })

  it('should dispose immediately on hide', () => {
    cy.mount(() => {
      return (
        <div class="flex m-[100px] p-4 w-[100px] gap-[160px]">
          <Tooltip v-slots={slotContents(0)} placement="bottom" isInteractive />
        </div>
      )
    })

    cy.get('.default-slot0')
    .realHover()

    cy.get('.v-popper__popper').should('be.visible')

    cy.get('body').realHover()
    cy.get('.v-popper__popper').should('not.exist', { timeout: 250 })
  })

  it('should allow light theme for Tooltip', () => {
    cy.mount(() => {
      return (
        <div class="flex bg-gray-900 m-[100px] text-white p-[40px] w-[150px] gap-[160px]">
          <Tooltip v-slots={slotContents(0)} placement="bottom" color="light" />
        </div>
      )
    })

    cy.get('.default-slot0')
    .realHover()

    cy.get('.v-popper__popper').should('be.visible').and('have.class', 'cypress-v-tooltip-light')
    cy.percySnapshot()

    cy.get('body').realHover()
    cy.get('.v-popper__popper').should('not.exist', { timeout: 250 })
  })

  it('should allow dark theme for interactive Tooltip', () => {
    cy.mount(() => {
      return (
        <div class="flex m-[100px] p-4 w-[150px] gap-[160px]">
          <Tooltip v-slots={{
            popper: () => <Button>Call to Action!</Button>,
            default: () => <span>Hover Me!</span>,
          }} placement="bottom" isInteractive color="dark" />
        </div>
      )
    })

    cy.contains('span', 'Hover Me!')
    .realHover()

    cy.get('.v-popper__popper').should('be.visible').and('have.class', 'cypress-v-tooltip-dark')
    cy.contains('button', 'Call to Action!').click()
    // Interactive tooltips should stay open when interacting with content within the popper
    cy.get('.v-popper__popper').should('be.visible')
    cy.percySnapshot()

    cy.get('body').realHover()
    cy.get('.v-popper__popper').should('not.exist', { timeout: 250 })
  })
})
