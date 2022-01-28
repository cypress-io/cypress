import CopyButton from './CopyButton.vue'

describe('<CopyButton />', { viewportHeight: 80, viewportWidth: 120 }, () => {
  it('copies text to clipboard', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" />
    </>))
    .get('button')
    .should('contain.text', 'Copy')

    .get('svg')
    .should('exist')

    cy.findByRole('button', { name: 'Copy' }).realClick()

    cy.findByRole('button', { name: 'Copied!' }).should('be.visible')
  })

  it('noIcon hides the icon', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" noIcon={true} />
    </>))
    .get('svg')
    .should('not.exist')
  })
})
