const { assertLogLength } = require('../../../support/utils')

describe('src/cy/commands/navigation', () => {
  context('#form sub', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'form sub') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    // FIXME: fix flaky test (webkit): https://github.com/cypress-io/cypress/issues/24600
    it('logs \'form sub\'', { browser: '!webkit' }, () => {
      let event = null

      cy
      .visit('/fixtures/form.html')
      .then(() => {
        const $form = cy.$$('#click-me').on('submit', (e) => {
          event = e.originalEvent
        })

        cy
        .get('#click-me').find('input[type=submit]').click()
        .then(function () {
          assertLogLength(this.logs, 1)

          expect(this.logs[0].get('message')).to.eq(
            '--submitting form--',
          )

          expect(this.logs[0].invoke('consoleProps')).to.deep.eq({
            name: 'form sub',
            type: 'event',
            props: {
              'Originated From': $form.get(0),
              'Args': event,
            },
          })
        })
      })
    })
  })

  context('target=_top and target=_parent neutralization', () => {
    // https://github.com/cypress-io/cypress/issues/1244
    describe('links and forms with target=_top or _parent stay inside the AUT', () => {
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

    // https://github.com/cypress-io/cypress/issues/17512
    it('getAttribute("target") on a clicked anchor returns null when target is unset or removed and the set value otherwise', () => {
      cy.visit('fixtures/issue-17512.html')

      cy.get('#link').click()
      cy.get('#result').should('have.text', 'null')

      cy.get('#link2').click()
      cy.get('#result2').should('have.text', '"_top"')

      cy.get('#link3').click()
      cy.get('#result3').should('have.text', 'null')
    })

    // https://github.com/cypress-io/cypress/issues/26206
    it('removeAttribute works for non-target attributes after clicking an anchor with target=_top', () => {
      // After clicking an anchor with target="_top", the handleInvalidTarget function
      // patches the element's removeAttribute. The bug was that removeAttribute
      // would not work for attributes other than 'target'.
      cy.visit('fixtures/issue-26206.html')
      cy.get('#link').click()
      cy.get('#result').should('have.text', 'removed')
    })

    // The HTML `<base target>` attribute is inherited by every untargeted <a> / <form>
    // on the page. A value of `_top` or `_parent` navigates the AUT out of the Cypress
    // iframe, so the proxy's HTML rewriter strips the attribute at load time and the
    // driver runtime guard strips it from any `<base>` inserted after load.
    describe('<base target="_top|_parent">', { browser: '!webkit' }, () => {
      it('keeps anchor click inside AUT when <base target="_top"> is in source HTML', () => {
        cy.visit('/fixtures/base-target-top.html')
        cy.get('#link').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('keeps form submit inside AUT when <base target="_top"> is in source HTML', () => {
        cy.visit('/fixtures/base-target-top.html')
        cy.get('#submit').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('keeps anchor click inside AUT when <base target="_parent"> is in source HTML', () => {
        cy.visit('/fixtures/base-target-parent.html')
        cy.get('#link').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('keeps anchor click inside AUT when <base target="_top"> is injected after load', () => {
        cy.visit('/fixtures/base-target-dynamic.html')
        cy.window().then((win) => win.injectBase('_top'))
        cy.get('#link').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      it('keeps form submit inside AUT when <base target="_parent"> is injected after load', () => {
        cy.visit('/fixtures/base-target-dynamic.html')
        cy.window().then((win) => win.injectBase('_parent'))
        cy.get('#submit').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      // The HTML navigation algorithm matches `_top` / `_parent` ASCII case-insensitively,
      // so a mixed-case value is just as obstructive as the lowercase form.
      it('keeps anchor click inside AUT when <base target="_TOP"> (uppercase) is injected after load', () => {
        cy.visit('/fixtures/base-target-dynamic.html')
        cy.window().then((win) => win.injectBase('_TOP'))
        cy.get('#link').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })

      // A click on a descendant of an anchor (e.g. `<a><span>`) sets `e.target` to
      // the descendant rather than the anchor. The navigation still bubbles up to
      // the <a> and inherits the document's base target, so the base-level
      // neutralization must run independently of the per-element tag check.
      it('keeps click-on-anchor-child inside AUT when <base target="_top"> is injected after load', () => {
        cy.visit('/fixtures/base-target-dynamic.html')
        cy.window().then((win) => win.injectBase('_top'))
        cy.get('#nested-link-child').click()
        cy.get('#dom').should('contain', 'DOM')
        cy.url().should('include', 'dom.html')
      })
    })
  })
})
