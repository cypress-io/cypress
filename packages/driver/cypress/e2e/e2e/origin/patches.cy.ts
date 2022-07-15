describe('src/cross-origin/patches', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  context('submit', () => {
    it('correctly submits a form when the target is _top for HTMLFormElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('form').then(($form) => {
          expect($form.attr('target')).to.equal('_top')
          $form[0].submit()
        })

        cy.contains('Some generic content')
      })
    })
  })

  context('setAttribute', () => {
    it('renames integrity to cypress-stripped-integrity for HTMLFormElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('form').then(($form) => {
          $form.attr('integrity', 'sha-123')
          expect($form.attr('integrity')).to.be.undefined
          expect($form.attr('cypress-stripped-integrity')).to.equal('sha-123')
        })
      })
    })

    it('renames integrity to cypress-stripped-integrity for HTMLAnchorElement', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('a[data-cy="hashChange"]').then(($anchor) => {
          $anchor.attr('integrity', 'sha-123')
          expect($anchor.attr('integrity')).to.be.undefined
          expect($anchor.attr('cypress-stripped-integrity')).to.equal('sha-123')
        })
      })
    })

    it('doesn\'t rename integrity for other elements', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('button[data-cy="alert"]').then(($button) => {
          $button.attr('integrity', 'sha-123')
          expect($button.attr('integrity')).to.equal('sha-123')
          expect($button.attr('cypress-stripped-integrity')).to.be.undefined
        })
      })
    })
  })
})
