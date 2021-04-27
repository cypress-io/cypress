describe('character encoding tests', () => {
  [
    {
      title: 'without gzip',
      extension: '.html',
    },
    {
      title: 'with gzip',
      extension: '.html.gz',
    },
    {
      title: 'without gzip (no content-type charset)',
      extension: '.html.pageonly',
    },
    {
      title: 'with gzip (no content-type charset)',
      extension: '.html.gz.pageonly',
    },
  ].forEach(({ title, extension }) => {
    context(title, () => {
      it('iso-8859-1 works', () => {
        cy.visit(`/iso-8859-1${extension}`)
        cy.get('#t1').should('have.html', 'Olá Mundo')
        cy.get('#t2').should('have.html', 'Ç')
        cy.get('#t3').should('have.html', 'Pêssego')
      })

      it('euc-kr works', () => {
        cy.visit(`/euc-kr${extension}`)
        cy.get('.text').should('contain.html', '서울 남산케이블카 운행')
      })

      it('shift-jis works', () => {
        cy.visit(`/shift-jis${extension}`)
        cy.get('body').should('contain.html', '総合サポート・お問い合わせ')
      })

      it('gb2312 works', () => {
        cy.visit(`/gb2312${extension}`)
        cy.get('h3').should('contain.html', '雨果主题展8月启幕')
      })
    })
  })
})
