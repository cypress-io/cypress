import { CONFIG_LEGEND_COLOR_MAP } from '../ConfigSourceColors'
import RenderPrimitive from './RenderPrimitive.vue'

function mountWithPrimitive (value: string| number | null, from: string) {
  cy.mount(() => {
    return (
      <div class="p-12 overflow-auto">
        <RenderPrimitive
          from={from}
          value={value}
          class={CONFIG_LEGEND_COLOR_MAP[from]}
        />
      </div>
    )
  })
}

describe('<RenderPrimitive />', () => {
  it('Should render null/undefined primitives nicely', () => {
    mountWithPrimitive(null, 'env')
    cy.contains('null').should('be.visible').realHover()

    cy.get('.v-popper__popper--shown')
    .should('be.visible')
    .should('contain.text', 'env')
  })

  it('Should render string function primitives nicely', () => {
    mountWithPrimitive('[Function] renderHelloWorld ', 'default')
    cy.contains('renderHelloWorld ( ) { ... }').should('be.visible').realHover()

    cy.get('.v-popper__popper--shown')
    .should('be.visible')
    .should('contain.text', 'default')
  })

  it('Should render numeric primitives nicely', () => {
    mountWithPrimitive(112358, 'cli')
    cy.contains('112358').should('be.visible').realHover()

    cy.get('.v-popper__popper--shown')
    .should('be.visible')
    .should('contain.text', 'cli')
  })
})
