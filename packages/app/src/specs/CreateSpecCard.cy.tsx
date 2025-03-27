// Anything with onClick SHOULD work, but isn't...
// Defining emits for "Button.vue" removes the native handler on the
// <button> element. vue-tsc just can't handle this yet.
import CreateSpecCard from './CreateSpecCard.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import DocumentCode from '~icons/cy/document-code_x48'

const iconSelector = '[data-cy=card-icon]'
const specCardSelector = '[data-cy=card]'
const header = 'My header text here'
const shortDescription = `We'll walk you through generating your first spec from a component.`

describe('<CreateSpecCard />', { viewportWidth: 400, viewportHeight: 400 }, () => {
  it('renders with long text', () => {
    const longHeader = 'Create from very long header content alsowhenwordshaveno-linebreaks'
    const longDescription = `This is some description text to explain how we import stuff using this button. Specifically, we're going to create specs from your user input. Also, this is a very long description to test how our CreateSpecCard resizes.`

    cy.mount(() => (
      <div class="m-12">
        <CreateSpecCard icon={DocumentCode} header={longHeader} description={longDescription} />
      </div>
    )).get(specCardSelector)
    .should('contain.text', longHeader)
    .and('contain.text', longDescription)

    cy.percySnapshot()
  })

  it('renders with normal length text', () => {
    cy.mount(() => (
      <div class="m-12">
        <CreateSpecCard icon={DocumentCode} header={header} description={shortDescription} />
      </div>
    )).get(specCardSelector)
    .should('contain.text', header)
    .and('contain.text', shortDescription)
  })

  it('renders the icon passed in', () => {
    cy.mount(() => (
      <div class="m-12">
        <CreateSpecCard icon={DocumentCode} header={header} description={shortDescription} />
      </div>
    )).get(iconSelector)
    .should('be.visible')
  })

  it('emits click events bound to it', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    cy.mount(() => (<div class="m-12">
      <CreateSpecCard icon={DocumentCode} header={header} description={shortDescription}
        // @ts-ignore - vue @click isn't represented in JSX
        onClick={onClickSpy} />
    </div>))
    .get(specCardSelector)
    .click()
    .get('@onClickSpy').should('have.been.calledOnce')
  })
})
