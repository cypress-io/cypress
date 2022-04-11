import Tooltip from './Tooltip.vue'

const slotContents = {
  popper: () => <span>tooltip</span>,
  default: () => <span class="default-slot">hello</span>,
}

describe('<Tooltip />', () => {
  it('playground', () => {
    cy.mount(() => {
      return (
        <div class="p-4 w-100px">
          <Tooltip v-slots={slotContents} placement="right" />
        </div>
      )
    })

    cy.get('.default-slot')
    .realHover()

    cy.contains('tooltip')
  })
})
