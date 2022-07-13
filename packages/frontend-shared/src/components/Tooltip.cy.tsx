import Tooltip from './Tooltip.vue'

const slotContents = (x: number) => ({
  popper: () => <span>Tooltip {x}</span>,
  default: () => <span class={`default-slot${x}`}>hello</span>,
})

describe('<Tooltip />', () => {
  it('playground', () => {
    cy.mount(() => {
      return (
        <div class="p-4 w-100px">
          {/* @ts-ignore */}
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
        <div class="flex m-100px p-4 w-100px gap-160px">
          {/* @ts-ignore */}
          <Tooltip v-slots={slotContents(0)} placement="bottom" isInteractive />
          <Tooltip v-slots={slotContents(1)} placement="top" isInteractive />
          <Tooltip v-slots={slotContents(2)} placement="left" isInteractive />
          <Tooltip v-slots={slotContents(3)} placement="right" isInteractive />
        </div>
      )
    })

    cy.get('.default-slot0')
    .realHover()

    cy.get('.default-slot1')
    .realHover()

    cy.get('.default-slot2')
    .realHover()

    cy.get('.default-slot3')
    .realHover()

    cy.contains('Tooltip 0')
    cy.contains('Tooltip 1')
    cy.contains('Tooltip 2')
    cy.contains('Tooltip 3')
  })
})
