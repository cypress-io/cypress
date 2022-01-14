import CopyButton from './CopyButton.vue'

describe('<CopyButton />', { viewportHeight: 450, viewportWidth: 350 }, () => {
  it('copies text to clipboard', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" />
    </>))
    .get('button')
    .should('contain.text', 'Copy')

    .get('svg')
    .should('exist')

    // This button is broken on Firefox, but works properly on Chromium/Chrome/Electron
    // TODO: Add assertions about actually clicking the button.
  })

  it('noIcon hides the icon', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" noIcon={true} />
    </>))
    .get('svg')
    .should('not.exist')
  })
})
