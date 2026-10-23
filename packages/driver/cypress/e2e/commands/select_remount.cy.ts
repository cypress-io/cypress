describe('selecting a remounted element', () => {
  beforeEach(() => {
    cy.visit('/fixtures/empty.html')
  })

  const prepareRemount = (before: string, after: string) => {
    return cy.document().then((doc) => {
      const original = doc.createElement('select')
      const replacement = doc.createElement('select')
      const changes = { original: 0, replacement: 0 }

      original.id = replacement.id = 'remounted-select'
      original.innerHTML = before
      original.style.visibility = 'hidden'
      replacement.innerHTML = after
      original.addEventListener('change', () => changes.original++)
      replacement.addEventListener('change', () => changes.replacement++)
      doc.body.appendChild(original)

      cy.once('command:retry', () => {
        original.replaceWith(replacement)
      })

      return { original, replacement, changes }
    })
  }

  it('selects and yields the visible replacement rather than the detached original', () => {
    const options = '<option value="1">One</option><option value="2">Two</option>'

    prepareRemount(options, options).then(({ original, replacement, changes }) => {
      cy.get('#remounted-select').select('2').then(($selected) => {
        expect($selected[0]).to.eq(replacement)
        expect(original.isConnected).to.eq(false)
        expect(original.value).to.eq('1')
        expect(changes.original).to.eq(0)
        expect(changes.replacement).to.eq(1)
      })

      cy.get('#remounted-select').should('have.value', '2')
    })
  })

  it('resolves option metadata from the replacement when selecting by text', () => {
    prepareRemount(
      '<option value="0">Blank</option><option value="old">Choose me</option>',
      '<option value="0">Blank</option><option value="new">Choose me</option>',
    ).then(({ replacement }) => {
      cy.get('#remounted-select').select('Choose me').then(($selected) => {
        expect($selected[0]).to.eq(replacement)
      })

      cy.get('#remounted-select').should('have.value', 'new')
    })
  })

  it('preserves forced selection on an attached hidden element', () => {
    cy.document().then((doc) => {
      const select = doc.createElement('select')

      select.id = 'forced-hidden-select'
      select.style.visibility = 'hidden'
      select.innerHTML = '<option value="1">One</option><option value="2">Two</option>'
      doc.body.appendChild(select)
    })

    cy.get('#forced-hidden-select').select('2', { force: true }).should('have.value', '2')
  })
})
