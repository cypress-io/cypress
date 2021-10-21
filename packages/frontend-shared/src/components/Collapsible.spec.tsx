import Collapsible from './Collapsible.vue'
import faker from 'faker'

const targetText = 'Target'
const contentText = 'Content'
const collapsibleSelector = '[data-testid=collapsible]'
const targetSelector = '[data-testid=target]'
const contentSelector = '[data-testid=content]'
const target = () => <div data-testid="target">{ targetText }</div>

describe('<Collapsible />', { viewportHeight: 450, viewportWidth: 350 }, () => {
  it.only('renders the target and content slots', () => {
    cy.mount(() => <>
      <Collapsible data-testid="collapsible" vSlots={ { target } }>
        <p data-testid="content">{ contentText }</p>
      </Collapsible>
    </>)
      .get(targetSelector)
      .should('contain.text', targetText)
      .click()
      .click()
      .get(contentSelector)
      .should('contain.text', contentText)
  })

  it('does not render default slot if lazy', () => {
    cy.mount(() => <>
      <Collapsible data-testid="collapsible" vSlots={ { target } } lazy={true}>
        <p data-testid="content">{ contentText }</p>
      </Collapsible>
    </>)
      .get(targetSelector)
      .should('contain.text', targetText)
      .click()
      .get(contentSelector)
      .should('contain.text', contentText)
  })

  it('playground', () => {
    const text = faker.lorem.paragraphs(5)
    const bottomText = 'Bottom Text'

    const defaultSlot = () => (<div class="space-y-2">
      <h2 class="text-center text-lg bg-gray-50">
        Content Header
      </h2>
      <p class="bg-red-500 h-900px">{ text }</p>
      <p class="bg-green-500">{ bottomText }</p>
    </div>)
    const target = ({ open }) => (<h1 class={ ['text-xl', { 'pb-2': open }] }>Target</h1>)

    cy.mount(() => (<div class="mx-auto text-center w-300px my-4 border-1 p-4 rounded">
      <Collapsible vSlots={ {
        target,
        default: defaultSlot
      } } />
    </div>))
  })
})