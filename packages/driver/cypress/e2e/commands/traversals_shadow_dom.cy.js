describe('src/cy/commands/traversals - shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  context('#closest', () => {
    it('retrieves itself when it is the closest matching element within shadow dom', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .closest('p')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.class('shadow-3')
      })
    })

    it('retrieves the closest element beyond shadow boundaries', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .closest('#parent-of-shadow-container-0')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.id('parent-of-shadow-container-0')
      })
    })

    it('retrieves closest elements normally when no shadow roots', () => {
      cy
      .get('#shadow-element-3')
      .closest('#parent-of-shadow-container-0')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.id('parent-of-shadow-container-0')
      })
    })

    it('retrieves closest element when element is the shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .closest('#shadow-element-3')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.id('shadow-element-3')
      })
    })

    it('retrieves closest element when element is within the same shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .closest('div')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.class('shadow-div')
      })
    })

    it('retrieves closest element when element is a nested shadow root parent', () => {
      cy
      .get('#shadow-element-5')
      .find('p', { includeShadowDom: true })
      .closest('#shadow-element-4')
      .then(($parent) => {
        expect($parent.length).to.eq(1)
        expect($parent[0]).to.have.id('shadow-element-4')
      })
    })

    it('handles multiple elements in subject when parents are different', () => {
      cy
      .get('#shadow-element-1, #shadow-element-2')
      .find('div', { includeShadowDom: true })
      .closest('cy-test-element')
      .then(($parents) => {
        expect($parents.length).to.eq(2)
        expect($parents[0]).to.have.id('shadow-element-1')
        expect($parents[1]).to.have.id('shadow-element-2')
      })
    })

    it('handles multiple elements in subject when parents are same', () => {
      cy
      .get('#shadow-element-9')
      .find('.shadow-div', { includeShadowDom: true })
      .closest('cy-test-element')
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('shadow-element-9')
      })
    })
  })

  context('#find', () => {
    it('retrieves a matching element beyond shadow boundaries', () => {
      const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

      cy
      .get('#parent-of-shadow-container-0')
      .find('p', { includeShadowDom: true })
      .then(($element) => {
        expect($element.length).to.eq(1)
        expect($element[0]).to.eq(el)
      })
    })

    it('retrieves a matching element when no shadow roots', () => {
      const el = cy.$$('#shadow-element-3')[0]

      cy
      .get('#parent-of-shadow-container-0')
      .find('#shadow-element-3', { includeShadowDom: true })
      .then(($element) => {
        expect($element.length).to.eq(1)
        expect($element[0]).to.eq(el)
      })
    })

    it('allows traversal when already within a shadow root', () => {
      const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

      cy
      .get('#shadow-element-3')
      .shadow()
      .find('p')
      .then(($element) => {
        expect($element.length).to.eq(1)
        expect($element[0]).to.eq(el)
      })
    })

    // https://github.com/cypress-io/cypress/issues/7676
    it('does not error when querySelectorAll is wrapped and snapshots are off', () => {
      cy.visit('/fixtures/shadow-dom.html?wrap-qsa=true')
      cy.get('#shadow-element-1').find('.shadow-1', { includeShadowDom: true })
    })

    describe('non-command options', () => {
      describe('suite-level config', { includeShadowDom: true }, () => {
        beforeEach(() => {
          cy
          .get('#parent-of-shadow-container-0')
          .find('.shadow-div')
        })

        it('queries shadow dom', () => {
          cy
          .get('#parent-of-shadow-container-0')
          .find('.shadow-div')
        })

        it('also queries shadow dom', () => {
          cy
          .get('#parent-of-shadow-container-0')
          .find('.shadow-div')
        })
      })

      describe('test-level config', () => {
        it('queries shadow dom', { includeShadowDom: true }, () => {
          cy
          .get('#parent-of-shadow-container-0')
          .find('.shadow-div')
        })

        it('does not find element without option set', () => {
          cy
          .get('#parent-of-shadow-container-0')
          .find('.shadow-div').should('not.exist')
        })
      })

      describe('Cypress.config()', () => {
        const reset = () => {
          Cypress.config('includeShadowDom', false)
        }

        beforeEach(reset)
        afterEach(reset)

        it('turns option on and off at will', () => {
          cy.get('.shadow-div').should('not.exist').then(() => {
            Cypress.config('includeShadowDom', true)
          })

          cy.get('.shadow-div')
        })

        it('overrides test-level option being true', { includeShadowDom: true }, () => {
          Cypress.config('includeShadowDom', false)

          cy.get('.shadow-div').should('not.exist')
        })

        it('overrides test-level option being false', { includeShadowDom: false }, () => {
          Cypress.config('includeShadowDom', true)

          cy.get('.shadow-div')
        })
      })
    })
  })

  context('#parent', () => {
    it('retrieves parent within shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .parent()
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.class('shadow-div')
      })
    })

    it('retrieves parent by selector within shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('p', { includeShadowDom: true })
      .parent('.shadow-div')
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.class('shadow-div')
      })
    })

    it('retrieves parent when parent is shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('div', { includeShadowDom: true })
      .parent()
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('shadow-element-3')
      })
    })

    it('retrieves parent by selector when parent is shadow root', () => {
      cy
      .get('#shadow-element-3')
      .find('div', { includeShadowDom: true })
      .parent('#shadow-element-3')
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('shadow-element-3')
      })
    })

    it('retrieves parent when element is shadow root', () => {
      cy
      .get('#shadow-element-3')
      .parent()
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('parent-of-shadow-container-1')
      })
    })

    it('retrieves parent by selector when element is shadow root', () => {
      cy
      .get('#shadow-element-3')
      .parent('#parent-of-shadow-container-1')
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('parent-of-shadow-container-1')
      })
    })

    it('handles multiple elements in subject when parents are different', () => {
      cy
      .get('#shadow-element-1, #shadow-element-2')
      .find('div', { includeShadowDom: true })
      .parent()
      .then(($parents) => {
        expect($parents.length).to.eq(2)
        expect($parents[0]).to.have.id('shadow-element-1')
        expect($parents[1]).to.have.id('shadow-element-2')
      })
    })

    it('handles multiple elements in subject when parents are same', () => {
      cy
      .get('#shadow-element-9')
      .find('.shadow-div', { includeShadowDom: true })
      .parent()
      .then(($parents) => {
        expect($parents.length).to.eq(1)
        expect($parents[0]).to.have.id('shadow-element-9')
      })
    })
  })

  context('#parents', () => {
    describe('parents()', () => {
      it('retrieves all parents, including those beyond shadow boundaries', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parents()
        .then(($parents) => {
          expect($parents.length).to.eq(6)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          expect($parents[3]).to.have.id('parent-of-shadow-container-0')
          expect($parents[4]).to.match('body')
          expect($parents[5]).to.match('html')
        })
      })

      it('retrieves parents normally when no shadow roots exist', () => {
        cy
        .get('#shadow-element-3')
        .parents()
        .then(($parents) => {
          expect($parents.length).to.eq(4)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          expect($parents[1]).to.have.id('parent-of-shadow-container-0')
          expect($parents[2]).to.match('body')
          expect($parents[3]).to.match('html')
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('#shadow-element-3, #shadow-element-8')
        .find('p', { includeShadowDom: true })
        .parents()
        .then(($parents) => {
          expect($parents.length).to.eq(10)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          expect($parents[3]).to.have.id('parent-of-shadow-container-0')
          expect($parents[4]).to.have.class('shadow-div')
          expect($parents[5]).to.have.id('shadow-element-8')
          expect($parents[6]).to.have.id('parent-of-shadow-container-3')
          expect($parents[7]).to.have.id('parent-of-shadow-container-2')
          expect($parents[8]).to.match('body')
          expect($parents[9]).to.match('html')
        })
      })
    })

    describe('parents(selector) - ', () => {
      it('retrieves parents by selector within shadow root', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parents('.shadow-div')
        .then(($parents) => {
          expect($parents.length).to.eq(1)
          expect($parents[0]).to.have.class('shadow-div')
        })
      })

      it('retrieves parents by selector within and outside of shadow root', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parents('div')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('parent-of-shadow-container-1')
          expect($parents[2]).to.have.id('parent-of-shadow-container-0')
        })
      })

      it('retrieves parents by selector outside of shadow root', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parents('#parent-of-shadow-container-0')
        .then(($parents) => {
          expect($parents.length).to.eq(1)
          expect($parents[0]).to.have.id('parent-of-shadow-container-0')
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('#shadow-element-3, #shadow-element-8')
        .find('p', { includeShadowDom: true })
        .parents('.filter-me')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          expect($parents[1]).to.have.id('parent-of-shadow-container-3')
          expect($parents[2]).to.match('body')
        })
      })
    })
  })

  context('#parentsUntil', () => {
    describe('parentsUntil()', () => {
      it('retrieves all parents, including those beyond shadow boundaries', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parentsUntil()
        .then(($parents) => {
          expect($parents.length).to.eq(6)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          expect($parents[3]).to.have.id('parent-of-shadow-container-0')
          expect($parents[4]).to.match('body')
          expect($parents[5]).to.match('html')
        })
      })

      it('retrieves parents normally when no shadow roots exist', () => {
        cy
        .get('#shadow-element-3')
        .parentsUntil()
        .then(($parents) => {
          expect($parents.length).to.eq(4)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          expect($parents[1]).to.have.id('parent-of-shadow-container-0')
          expect($parents[2]).to.match('body')
          expect($parents[3]).to.match('html')
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('#shadow-element-3, #shadow-element-8')
        .find('p', { includeShadowDom: true })
        .parentsUntil()
        .then(($parents) => {
          expect($parents.length).to.eq(10)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          expect($parents[3]).to.have.id('parent-of-shadow-container-0')
          expect($parents[4]).to.have.class('shadow-div')
          expect($parents[5]).to.have.id('shadow-element-8')
          expect($parents[6]).to.have.id('parent-of-shadow-container-3')
          expect($parents[7]).to.have.id('parent-of-shadow-container-2')
          expect($parents[8]).to.match('body')
          expect($parents[9]).to.match('html')
        })
      })
    })

    describe('parentsUntil(selector)', () => {
      it('retrieves parents until selector within shadow root', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-8-nested-3', { includeShadowDom: true })
        .parentsUntil('.shadow-div')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.class('shadow-8-nested-2')
          expect($parents[1]).to.have.class('shadow-8-nested-1')
          expect($parents[2]).to.have.class('shadow-content')
        })
      })

      it('retrieves parents until selector within and outside of shadow root', () => {
        cy
        .get('#shadow-element-3')
        .find('p', { includeShadowDom: true })
        .parentsUntil('#parent-of-shadow-container-0')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
        })
      })

      it('retrieves parents until selector normally when no shadow roots exist', () => {
        cy
        .get('#shadow-element-3')
        .parentsUntil('#parent-of-shadow-container-0')
        .then(($parents) => {
          expect($parents.length).to.eq(1)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('#shadow-element-3, #shadow-element-8')
        .find('p', { includeShadowDom: true })
        .parentsUntil('body')
        .then(($parents) => {
          expect($parents.length).to.eq(8)
          expect($parents[0]).to.have.class('shadow-div')
          expect($parents[1]).to.have.id('shadow-element-3')
          expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          expect($parents[3]).to.have.id('parent-of-shadow-container-0')
          expect($parents[4]).to.have.class('shadow-div')
          expect($parents[5]).to.have.id('shadow-element-8')
          expect($parents[6]).to.have.id('parent-of-shadow-container-3')
          expect($parents[7]).to.have.id('parent-of-shadow-container-2')
        })
      })
    })

    describe('parentsUntil(selector, filter)', () => {
      it('retrieves parents until selector within shadow root and filters result', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-8-nested-3', { includeShadowDom: true })
        .parentsUntil('.shadow-div', '.filter-me')
        .then(($parents) => {
          expect($parents.length).to.eq(1)
          expect($parents[0]).to.have.class('shadow-8-nested-1')
        })
      })

      it('retrieves parents until selector within and outside of shadow root and filters result', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-8-nested-3', { includeShadowDom: true })
        .parentsUntil('#parent-of-shadow-container-0', '.filter-me')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.class('shadow-8-nested-1')
          expect($parents[1]).to.have.id('parent-of-shadow-container-3')
          expect($parents[2]).to.match('body')
        })
      })

      it('retrieves parents until selector normally when no shadow roots exist and filters result', () => {
        cy
        .get('#shadow-element-3')
        .parentsUntil('body', '.filter-me')
        .then(($parents) => {
          expect($parents.length).to.eq(1)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('#shadow-element-3, #shadow-element-8')
        .find('p', { includeShadowDom: true })
        .parentsUntil('html', '.filter-me')
        .then(($parents) => {
          expect($parents.length).to.eq(3)
          expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          expect($parents[1]).to.have.id('parent-of-shadow-container-3')
          expect($parents[2]).to.match('body')
        })
      })
    })

    describe('parentsUntil(element)', () => {
      it('retrieves parents until element within shadow root', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-div', { includeShadowDom: true })
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl[0])
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-8-nested-2')
            expect($parents[1]).to.have.class('shadow-8-nested-1')
            expect($parents[2]).to.have.class('shadow-content')
          })
        })
      })

      it('retrieves parents until element within and outside of shadow root', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl[0])
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-div')
            expect($parents[1]).to.have.id('shadow-element-3')
            expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('retrieves parents until element normally when no shadow roots exist', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .parentsUntil($untilEl[0])
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('html')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3, #shadow-element-8')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl[0])
          .then(($parents) => {
            expect($parents.length).to.eq(9)
            expect($parents[0]).to.have.class('shadow-div')
            expect($parents[1]).to.have.id('shadow-element-3')
            expect($parents[2]).to.have.id('parent-of-shadow-container-1')
            expect($parents[3]).to.have.id('parent-of-shadow-container-0')
            expect($parents[4]).to.have.class('shadow-div')
            expect($parents[5]).to.have.id('shadow-element-8')
            expect($parents[6]).to.have.id('parent-of-shadow-container-3')
            expect($parents[7]).to.have.id('parent-of-shadow-container-2')
            expect($parents[8]).to.match('body')
          })
        })
      })
    })

    describe('parentsUntil(element, filter)', () => {
      it('retrieves parents until element within shadow root and filters result', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-div', { includeShadowDom: true })
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl[0], '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.class('shadow-8-nested-1')
          })
        })
      })

      it('retrieves parents until element within and outside of shadow root and filters result', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl[0], '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-8-nested-1')
            expect($parents[1]).to.have.id('parent-of-shadow-container-3')
            expect($parents[2]).to.match('body')
          })
        })
      })

      it('retrieves parents until element normally when no shadow roots exist and filters result', () => {
        cy
        .get('body')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .parentsUntil($untilEl[0], '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('html')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3, #shadow-element-8')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl[0], '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
            expect($parents[1]).to.have.id('parent-of-shadow-container-3')
            expect($parents[2]).to.match('body')
          })
        })
      })
    })

    describe('parentsUntil(jQueryElement)', () => {
      it('retrieves parents until jquery element within shadow root', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-div', { includeShadowDom: true })
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl)
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-8-nested-2')
            expect($parents[1]).to.have.class('shadow-8-nested-1')
            expect($parents[2]).to.have.class('shadow-content')
          })
        })
      })

      it('retrieves parents until jquery element within and outside of shadow root', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl)
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-div')
            expect($parents[1]).to.have.id('shadow-element-3')
            expect($parents[2]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('retrieves parents until jquery element normally when no shadow roots exist', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .parentsUntil($untilEl)
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('html')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3, #shadow-element-8')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl)
          .then(($parents) => {
            expect($parents.length).to.eq(9)
            expect($parents[0]).to.have.class('shadow-div')
            expect($parents[1]).to.have.id('shadow-element-3')
            expect($parents[2]).to.have.id('parent-of-shadow-container-1')
            expect($parents[3]).to.have.id('parent-of-shadow-container-0')
            expect($parents[4]).to.have.class('shadow-div')
            expect($parents[5]).to.have.id('shadow-element-8')
            expect($parents[6]).to.have.id('parent-of-shadow-container-3')
            expect($parents[7]).to.have.id('parent-of-shadow-container-2')
            expect($parents[8]).to.match('body')
          })
        })
      })
    })

    describe('parentsUntil(jQueryElement, filter)', () => {
      it('retrieves parents until jquery element within shadow root and filters result', () => {
        cy
        .get('#shadow-element-8')
        .find('.shadow-div', { includeShadowDom: true })
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl, '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.class('shadow-8-nested-1')
          })
        })
      })

      it('retrieves parents until jquery element within and outside of shadow root and filters result', () => {
        cy
        .get('#parent-of-shadow-container-0')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-8')
          .find('.shadow-8-nested-3', { includeShadowDom: true })
          .parentsUntil($untilEl, '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.class('shadow-8-nested-1')
            expect($parents[1]).to.have.id('parent-of-shadow-container-3')
            expect($parents[2]).to.match('body')
          })
        })
      })

      it('retrieves parents until jquery element normally when no shadow roots exist and filters result', () => {
        cy
        .get('body')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3')
          .parentsUntil($untilEl, '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(1)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
          })
        })
      })

      it('handles multiple elements in subject', () => {
        cy
        .get('html')
        .then(($untilEl) => {
          cy
          .get('#shadow-element-3, #shadow-element-8')
          .find('p', { includeShadowDom: true })
          .parentsUntil($untilEl, '.filter-me')
          .then(($parents) => {
            expect($parents.length).to.eq(3)
            expect($parents[0]).to.have.id('parent-of-shadow-container-1')
            expect($parents[1]).to.have.id('parent-of-shadow-container-3')
            expect($parents[2]).to.match('body')
          })
        })
      })
    })
  })
})
