import Collapsible from './Collapsible.vue'
import faker from 'faker'

const targetText = 'Target'
const contentText = 'Content'
const targetSelector = '[data-testid=target]'
const contentSelector = '[data-testid=content]'
const defaultTargetSlot = ({ open }) => <div data-testid="target" class={open ? 'open' : 'not-open'}>{ targetText }</div>
const defaultSlots = { target: defaultTargetSlot }

describe('<Collapsible />', { viewportHeight: 450, viewportWidth: 350 }, () => {
  describe('initiallyOpen', () => {
    it('defaults to closed', () => {
      // @ts-ignore - doesn't know about vSlots
      cy.mount(() => (<>
        <Collapsible vSlots={defaultSlots}>
          <p data-testid="content">{ contentText }</p>
        </Collapsible>
      </>)).get(targetSelector).should('have.class', 'not-open')
    })

    it('can be set to open initially', () => {
      // @ts-ignore - doesn't know about vSlots
      cy.mount(() => (<>
        <Collapsible vSlots={defaultSlots} initiallyOpen>
          <p data-testid="content">{ contentText }</p>
        </Collapsible>
      </>)).get(targetSelector).should('have.class', 'open')
    })
  })

  it('renders the target and content slots', () => {
    // @ts-ignore - doesn't know about vSlots
    cy.mount(() => (<>
      <Collapsible vSlots={defaultSlots}>
        <p data-testid="content">{ contentText }</p>
      </Collapsible>
    </>))
    .get(targetSelector)
    .should('contain.text', targetText)
    .click()
    .click()
    .get(contentSelector)
    .should('contain.text', contentText)
  })

  it('does not render default slot if lazy', () => {
    // @ts-ignore - doesn't know about vSlots
    cy.mount(() => (<>
      <Collapsible vSlots={defaultSlots} lazy={true}>
        <p data-testid="content">{ contentText }</p>
      </Collapsible>
    </>))
    .get(targetSelector)
    .should('contain.text', targetText)
    .click()
    .click()
    .get(contentSelector)
    .should('not.exist')
  })

  it('overflows properly', () => {
    const overflowedContentSelector = '[data-testid=overflowed-content]'

    // @ts-ignore - doesn't know about vSlots
    cy.mount(() => (<Collapsible maxHeight="200px" vSlots={defaultSlots}>
      <div class="h-900px">Large content</div>
      <p data-testid="overflowed-content">Out-of-bounds content</p>
    </Collapsible>))
    .get(targetSelector).click()
    .get(overflowedContentSelector)
    .should('not.be.visible')
    .parent()
    .scrollTo('bottom')
    .get(overflowedContentSelector)
    .should('be.visible')
  })

  it('does not toggle when clicking on content', () => {
    // @ts-ignore - doesn't know about vSlots
    cy.mount(() => (<>
      <Collapsible vSlots={defaultSlots}>
        <p data-testid="content">{ contentText }</p>
      </Collapsible>
    </>))
    .get(targetSelector)
    .click()
    .get(contentSelector)
    .click()
    .get(targetSelector)
    .should('have.class', 'open')
  })

  describe('slotProps', () => {
    describe('toggle', () => {
      it('passes the toggle slot prop to the default slot', () => {
        // @ts-ignore - doesn't know about vSlots
        cy.mount(() => (<Collapsible vSlots={{
          target: defaultTargetSlot,
          default: ({ toggle, open }) => (
            <div data-testid="content"
              onClick={toggle}
              class={open ? 'open' : 'not-open'}>
              Inner Content
            </div>),
        }} />))
        .get(targetSelector)
        .click()
        .get(contentSelector)
        .should('have.class', 'open')
        .click()
        .should('not.have.class', 'open')
      })
    })

    describe('open', () => {
      const slotPropsDefaultSlot = ({ open }) => <div data-testid="content" class={open ? 'open' : 'not-open'}>Content is: { open ? 'open' : 'not-open' }</div>

      const slotPropsSlots = {
        target: defaultTargetSlot,
        default: slotPropsDefaultSlot,
      }

      it('passes the open slot props to the header and default slots', () => {
        // @ts-ignore - doesn't know about vSlots
        cy.mount(() => (<Collapsible vSlots={slotPropsSlots}></Collapsible>))
        .get(contentSelector)
        .should('have.class', 'not-open')
        .get(targetSelector)
        .should('have.class', 'not-open')
        .click()
        .get(targetSelector)
        .should('have.class', 'open')
        .get(contentSelector)
        .should('have.class', 'open')
      })
    })
  })

  it('playground', () => {
    const text = faker.lorem.paragraphs(5)
    const bottomText = 'Bottom Text'

    const target = ({ open }) => (<h1 class={['text-xl', { 'pb-2': open }]}>Click here to open</h1>)

    cy.mount(() => (<div class="mx-auto text-center w-300px my-4 border-1 p-4 rounded">

      <Collapsible vSlots={{ target }}>
        <div class="space-y-2">
          <h2 class="text-center text-lg bg-gray-50">
            Content Header
          </h2>
          <p class="bg-red-500 h-900px">{ text }</p>
          <p class="bg-green-500">{ bottomText }</p>
        </div>
      </Collapsible>
    </div>))
  })
})
