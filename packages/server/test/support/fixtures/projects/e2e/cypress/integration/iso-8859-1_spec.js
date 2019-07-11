describe('Characters ISO-8859-1 tests', () => {
  [
    {
      title: 'without gzip',
      url: '/iso-8859-1.html',
    },
    {
      title: 'with gzip',
      url: '/iso-8859-1.html.gz',
    },
    {
      title: 'without gzip (no content-type charset)',
      url: '/iso-8859-1.html.pageonly',
    },
    {
      title: 'with gzip (no content-type charset)',
      url: '/iso-8859-1.html.gz.pageonly',
    },
  ].map(({ title, url }) => {
    context(title, () => {
      beforeEach(() => {
        cy.visit(url)
      })

      it('Validation 1', () => {
        cy.get('#t1').should('have.html', 'Olá Mundo')
      })

      it('Validation 2', () => {
        cy.get('#t2').should('have.html', 'Ç')
      })

      it('Validation 3', () => {
        cy.get('#t3').should('have.html', 'Pêssego')
      })

      it('Validation 4', () => {
        cy.get('#t4').should('have.html', 'Pão')
      })

      it('Validation 4', () => {
        cy.get('#t4').should('have.html', 'Pão')
      })

      it('Validation 5', () => {
        cy.get('#t5').should('have.html', 'Gestão')
      })

      it('Validation 6', () => {
        cy.get('#t6').should('have.html', 'Distribuição')
      })
    })

  })
})
