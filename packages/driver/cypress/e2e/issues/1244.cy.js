describe('issue 1244', () => {
  beforeEach(() => {
    cy.visit('/fixtures/issue-1244.html').then(() => {
      cy.on('window:before:unload', (e) => {
        const win = cy.state('window')

        // not all pages that get unloaded during this spec have getCounters()
        if (win.location.href.includes('issue-1244.html')) {
          // TODO: re-enable when capture completes dom transition.
          // getCounters is changed when setAttribute/getAttribute
          // is called which is necessary for certain capture code to work.
          // once dom transition is complete, that capture code will no
          // longer rely on setAttribute/getAttribute.
          // see: https://github.com/cypress-io/cypress-services/issues/7725

          // expect(win.getCounters()).to.deep.equal({ getCounter: 0, setCounter: 0 })
        }
      })
    })
  })

  for (const [el, target, action] of [['button', 'form', 'submit'], ['a', 'a', 'click']]) {
    // <form> submit, <a> click
    // TODO(webkit): fix+unskip for webkit release, or make skip more specific (only 4 of these generated tests fail in webkit)
    describe(`<${target}> ${action}`, { browser: '!webkit' }, () => {
      it('correctly redirects when target=_top with target.target =', () => {
        cy.get(`${el}.setTarget`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_top with setAttribute', () => {
        cy.get(`${el}.setAttr`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_top inline in dom', () => {
        cy.get(`${el}.inline_top`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('correctly redirects when target=_parent inline in dom', () => {
        cy.get(`${el}.inline_parent`).click()
        cy.url().should('include', 'empty.html')
      })

      it('maintains behavior when target=_self', () => {
        cy.get(`${el}.inline_self`).click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('maintains behavior when target=_blank,invalid', () => {
        cy.get(`${el}.inline_blank`).click().then(() => {
          cy.url().should('not.include', 'dom.html')
        })

        cy.get(`${el}.inline_invalid`).click().then(() => {
          cy.url().should('not.include', 'dom.html')
        })
      })
    })
  }

  describe('nested frame', () => {
    it('does not strip form _parent', () => {
      cy.get('iframe').then(($iframe) => {
        const $el = $iframe.contents().find('button.inline_parent')

        expect($el.closest('form')).to.have.attr('target', '_parent')

        $el.trigger('click')
      })

      cy.url().should('include', 'empty.html')
    })

    // NOTE: a previous test opens dom.html in a new window. This request does not
    // receive a cross-domain injection from the proxy, and the browser caches
    // it. Top cannot communicate with this iframe, and relies on the cross-
    // domain injection to determine href, etc. cy.ts hangs on waiting for
    // the cross-domain injection to postMessage back to top, causing
    // this test to hang. See: https://github.com/cypress-io/cypress/issues/28681

    /*
    it('does not strip link _parent', { retries: 15 }, () => {
      cy.get('iframe').then(($iframe) => {
        const $el = $iframe.contents().find('a.inline_parent')

        $el[0].click()
      })

      cy.get('#dom').should('contain', 'DOM')
      cy.url().should('include', 'dom.html')
    })
    */

    it('does not strip link_parent', () => {
      cy.get('iframe').then(($iframe) => {
        const $el = $iframe.contents().find('a.inline_parent')

        $el[0].click()
      })

      cy.url().should('include', 'empty.html')
    })
  })
})
