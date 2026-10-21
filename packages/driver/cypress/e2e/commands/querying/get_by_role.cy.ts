describe('src/cy/commands/querying/get_by_role', () => {
  const { _ } = Cypress

  beforeEach(() => {
    cy.visit('/fixtures/a11y/roles.html')
  })

  const ids = ($el: JQuery) => $el.toArray().map((el) => el.id)

  context('roles', () => {
    it('finds elements by the role implied by their tag', () => {
      cy.get('#implicit').getByRole('button').then(($el) => {
        expect(ids($el)).to.deep.eq(['implicit-button', 'submit-input'])
      })
    })

    it('finds elements whose role depends on their attributes', () => {
      cy.get('#implicit').within(() => {
        cy.getByRole('textbox').then(($el) => {
          expect(ids($el)).to.deep.eq(['text-input', 'untyped-input'])
        })

        cy.getByRole('searchbox').should('have.id', 'search-input')
        cy.getByRole('checkbox').should('have.id', 'checkbox-input')
        cy.getByRole('combobox').should('have.id', 'single-select')
        cy.getByRole('listbox').should('have.id', 'multi-select')
        cy.getByRole('img').should('have.id', 'logo')
        cy.getByRole('presentation').should('have.id', 'decorative')
      })
    })

    it('only gives a link role to an anchor with an href', () => {
      cy.get('nav').getByRole('link').should('have.length', 2)
    })

    it('finds landmarks', () => {
      cy.getByRole('banner').should('match', 'header')
      cy.getByRole('navigation').should('match', 'nav')
      cy.getByRole('main').should('match', 'main')
      cy.getByRole('contentinfo').should('match', 'footer')
      cy.getByRole('region').should('have.length', 6)
    })

    it('finds elements by an explicit role', () => {
      cy.get('#explicit').within(() => {
        cy.getByRole('button', { native: false }).should('have.id', 'div-button')
        cy.getByRole('tab').should('have.id', 'tab-button')
        cy.getByRole('heading', { name: 'Div heading', native: false }).should('have.id', 'div-heading')
      })
    })

    it('lets an explicit role replace the implicit one', () => {
      cy.get('#explicit').getByRole('button', { native: false }).should('not.have.id', 'tab-button')
    })

    it('only uses the first valid token of a role attribute', () => {
      cy.getByRole('switch').should('have.id', 'multi-role')
      cy.get('#explicit').getByRole('checkbox').should('not.exist')
    })

    it('yields every match, in document order', () => {
      cy.getByRole('heading', { native: false }).then(($el) => {
        expect($el.toArray().map((el) => el.textContent)).to.deep.eq([
          'Account settings',
          'Implicit roles',
          'Explicit roles',
          'Div heading',
          'Accessible names',
          'Visibility',
          'Shadow DOM',
          'Dynamic content',
        ])
      })
    })

    it('does not match the subject itself', () => {
      cy.get('#implicit-button').getByRole('button').should('not.exist')
    })
  })

  context('names', () => {
    _.each([
      { source: 'the element content, with whitespace collapsed', role: 'button', name: 'Save changes', id: 'name-content' },
      { source: 'aria-label', role: 'button', name: 'Close dialog', id: 'name-aria-label' },
      { source: 'aria-labelledby', role: 'button', name: 'Delete account', id: 'name-labelledby' },
      { source: 'a wrapping label', role: 'textbox', name: 'Email', id: 'name-wrapping-label' },
      { source: 'a label with a for attribute', role: 'textbox', name: 'Username', id: 'name-label-for-textbox' },
      { source: 'alt text', role: 'img', name: 'Company logo', id: 'logo' },
      { source: 'title', role: 'button', name: 'Help', id: 'name-title' },
      { source: 'nested content', role: 'button', name: 'Download report', id: 'name-nested' },
      // https://github.com/testing-library/cypress-testing-library/issues/290
      { source: 'the hidden content of a hidden aria-labelledby target', role: 'button', name: 'Archive', id: 'name-hidden-labelledby' },
    ], ({ source, role, name, id }) => {
      it(`matches a name from ${source}`, () => {
        cy.getByRole(role, { name }).should('have.id', id)
      })
    })

    it('leaves content hidden from the accessibility tree out of the name', () => {
      cy.getByRole('button', { name: 'Send' }).should('have.id', 'name-hidden-content')
    })

    it('requires a string to match the whole name, case-sensitively', () => {
      cy.getByRole('button', { name: 'Save' }).should('not.exist')
      cy.getByRole('button', { name: 'save changes' }).should('not.exist')
    })

    it('matches a name against a regular expression', () => {
      cy.getByRole('button', { name: /^save/i }).should('have.id', 'name-content')
      cy.get('#names').getByRole('button', { name: /o/ }).should('have.length', 3)
    })

    it('matches a name with a function that receives the name and the element', () => {
      const matcher = cy.stub().callsFake((name: string, element: Element) => name.startsWith('Close') && element.tagName === 'BUTTON')

      cy.getByRole('button', { name: matcher }).should('have.id', 'name-aria-label').then(() => {
        expect(matcher).to.be.calledWith('Close dialog')
      })
    })

    it('matches a number as a string', () => {
      cy.get('#names').invoke('append', '<button id="numeric">42</button>')
      cy.getByRole('button', { name: 42 }).should('have.id', 'numeric')
    })
  })

  context('hidden elements', () => {
    it('skips elements hidden from the accessibility tree', () => {
      cy.get('#visibility').getByRole('button').then(($el) => {
        expect(ids($el)).to.deep.eq(['visually-hidden-button', 'zero-opacity-button'])
      })
    })

    it('includes elements that are only visually hidden, unlike cy.get()', () => {
      cy.getByRole('button', { name: 'Visually hidden' }).should('have.id', 'visually-hidden-button')
    })

    it('includes elements hidden from the accessibility tree when hidden is true', () => {
      cy.get('#visibility').getByRole('button', { hidden: true }).then(($el) => {
        expect(ids($el)).to.deep.eq([
          'aria-hidden-button',
          'aria-hidden-parent-button',
          'hidden-attr-button',
          'display-none-button',
          'visibility-hidden-button',
          'visually-hidden-button',
          'zero-opacity-button',
        ])
      })
    })

    it('matches the name of an element inside a hidden container', () => {
      cy.getByRole('button', { name: 'Inside aria hidden', hidden: true }).should('have.id', 'aria-hidden-parent-button')
    })

    it('matches the name of an element that is itself hidden', () => {
      cy.getByRole('button', { name: 'Aria hidden', hidden: true }).should('have.id', 'aria-hidden-button')
      cy.getByRole('button', { name: 'Visibility hidden', hidden: true }).should('have.id', 'visibility-hidden-button')
    })
  })

  context('native elements', () => {
    it('skips elements that only have the role through a role attribute by default', () => {
      cy.get('#explicit').getByRole('button').should('not.exist')
      cy.get('#explicit').getByRole('button', { native: true }).should('not.exist')
    })

    it('includes elements that only have the role through a role attribute with native: false', () => {
      cy.get('#explicit').getByRole('button', { native: false }).should('have.id', 'div-button')
    })

    it('finds elements whose tag gives them the role', () => {
      cy.get('#implicit').getByRole('button').then(($el) => {
        expect(ids($el)).to.deep.eq(['implicit-button', 'submit-input'])
      })
    })

    it('skips a role attribute that gives an element a role its tag does not', () => {
      cy.getByRole('heading', { name: 'Div heading' }).should('not.exist')
      cy.getByRole('heading', { name: 'Div heading', native: false }).should('have.id', 'div-heading')
    })

    it('matches role attributes for a role that HTML has no element for', () => {
      cy.getByRole('tab').should('have.id', 'tab-button')
      cy.getByRole('tab', { native: false }).should('have.id', 'tab-button')
    })
  })

  context('shadow DOM', () => {
    it('does not search shadow roots by default', () => {
      cy.getByRole('button', { name: 'Shadow button' }).should('not.exist')
    })

    it('searches shadow roots, including nested ones, with includeShadowDom', () => {
      cy.getByRole('button', { name: 'Shadow button', includeShadowDom: true }).should('have.id', 'shadow-button')
      cy.getByRole('link', { name: 'Nested shadow link', includeShadowDom: true }).should('have.length', 1)
    })

    it('yields shadow matches in document order, at their host', () => {
      cy.get('main').getByRole('button', { name: /^(Shadow button|Add alert)$/, includeShadowDom: true }).then(($el) => {
        expect(ids($el)).to.deep.eq(['shadow-button', 'add-alert'])
      })
    })

    it('treats a shadow tree under an aria-hidden host as hidden', () => {
      cy.getByRole('button', { name: 'Hidden shadow button', includeShadowDom: true }).should('not.exist')
      cy.getByRole('button', { name: 'Hidden shadow button', includeShadowDom: true, hidden: true }).should('have.length', 1)
    })

    it('uses the includeShadowDom config option', { includeShadowDom: true }, () => {
      cy.getByRole('button', { name: 'Shadow button' }).should('have.id', 'shadow-button')
    })

    it('searches from a shadow root yielded by .shadow()', () => {
      cy.get('#shadow-host').shadow().getByRole('button').should('have.id', 'shadow-button')
    })

    it('searches a bare shadow root yielded by cy.wrap()', () => {
      cy.get('#shadow-host').then(($host) => {
        cy.wrap($host[0].shadowRoot).getByRole('button').should('have.id', 'shadow-button')
      })
    })
  })

  context('scope', () => {
    it('searches inside .within()', () => {
      cy.get('#explicit').within(() => {
        cy.getByRole('heading', { native: false }).then(($el) => {
          expect($el.toArray().map((el) => el.textContent)).to.deep.eq(['Explicit roles', 'Div heading'])
        })
      })
    })

    // https://github.com/testing-library/cypress-testing-library/issues/201
    it('searches a chained subject rather than the .within() scope', () => {
      cy.get('main').within(() => {
        cy.get('#implicit').getByRole('button').then(($el) => {
          expect(ids($el)).to.deep.eq(['implicit-button', 'submit-input'])
        })
      })
    })

    it('searches the descendants of every subject element', () => {
      cy.get('#implicit, #explicit').getByRole('button', { native: false }).should('have.length', 3)
    })

    it('searches a bare element yielded by cy.wrap()', () => {
      cy.get('#implicit').then(($el) => {
        cy.wrap($el[0]).getByRole('button').then(($buttons) => {
          expect(ids($buttons)).to.deep.eq(['implicit-button', 'submit-input'])
        })
      })
    })

    it('can be chained off window or document, searching the whole page', () => {
      cy.document().getByRole('banner').should('have.length', 1)
      cy.window().getByRole('banner').should('have.length', 1)
    })
  })

  context('retries', () => {
    it('retries until an element appears', () => {
      cy.getByRole('button', { name: 'Add alert' }).click()
      cy.getByRole('alert').should('have.text', 'Changes saved')
    })

    it('retries until an element is removed', () => {
      cy.getByRole('status', { native: false }).should('exist')
      cy.getByRole('button', { name: 'Remove status' }).click()
      cy.getByRole('status', { native: false }).should('not.exist')
    })

    it('retries until the name changes', () => {
      cy.get('#implicit-button').then(($button) => {
        setTimeout(() => {
          $button.text('Renamed button')
        }, 200)
      })

      cy.getByRole('button', { name: 'Renamed button' }).should('have.id', 'implicit-button')
    })

    // A `status` never takes its name from its content, only from `aria-label`
    // or `aria-labelledby`.
    it('does not name a status from its content', () => {
      cy.getByRole('status', { name: 'Saving', native: false }).should('not.exist')
      cy.get('#status').invoke('attr', 'aria-label', 'Saving')
      cy.getByRole('status', { name: 'Saving', native: false }).should('have.id', 'status')
    })

    it('retries until an element stops being hidden', () => {
      cy.get('#aria-hidden-button').then(($button) => {
        setTimeout(() => {
          $button.removeAttr('aria-hidden')
        }, 200)
      })

      cy.getByRole('button', { name: 'Aria hidden' }).should('have.id', 'aria-hidden-button')
    })

    it('gives a cell in a grid the gridcell role', () => {
      cy.get('#dynamic-container').invoke('append', '<table role="grid"><tr><td id="grid-cell">Cell</td></tr></table>')
      cy.getByRole('gridcell', { name: 'Cell' }).should('have.id', 'grid-cell')
      cy.getByRole('cell', { name: 'Cell' }).should('not.exist')
    })

    it('re-queries the page when a later command needs a fresh subject', () => {
      cy.getByRole('status', { native: false }).as('status')
      cy.get('#status').invoke('attr', 'role', 'log')
      cy.get('#dynamic-container').invoke('append', '<div id="new-status" role="status">New</div>')
      cy.get('@status').should('have.id', 'new-status')
    })
  })

  context('logging', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'getByRole') {
          this.lastLog = log
          this.logs.push(log)
        }
      })
    })

    it('logs the role and options', function () {
      cy.getByRole('button', { name: 'Help' }).then(function ($el) {
        const { lastLog } = this

        expect(lastLog.get('message')).to.eq('button, {name: Help}')
        expect(lastLog.get('type')).to.eq('parent')
        expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
      })
    })

    it('logs only the role when there are no options', function () {
      cy.getByRole('banner').then(function () {
        expect(this.lastLog.get('message')).to.eq('banner')
      })
    })

    it('logs as a child command when chained', function () {
      cy.get('#explicit').getByRole('tab').then(function () {
        expect(this.lastLog.get('type')).to.eq('child')
      })
    })

    it('does not log with log: false', function () {
      cy.getByRole('banner', { log: false }).then(function () {
        expect(this.lastLog).to.be.undefined
      })
    })

    it('includes the query in the console props', function () {
      cy.get('#explicit').getByRole('button', { name: 'Div button', native: false }).then(function ($el) {
        const consoleProps = this.lastLog.invoke('consoleProps')

        expect(consoleProps.name).to.eq('getByRole')
        expect(consoleProps.props).to.deep.eq({
          Role: 'button',
          Options: { name: 'Div button', native: false },
          'Applied To': cy.$$('#explicit').get(0),
          Yielded: $el.get(0),
          Elements: 1,
        })
      })
    })
  })

  context('errors', {
    defaultCommandTimeout: 100,
  }, () => {
    const expectError = (message: string | RegExp, done: Mocha.Done, check?: (err: Cypress.CypressError) => void) => {
      cy.on('fail', (err) => {
        if (typeof message === 'string') {
          expect(err.message).to.include(message)
        } else {
          expect(err.message).to.match(message)
        }

        check?.(err)
        done()
      })
    }

    _.each([
      {
        title: 'throws when the role is not a string',
        args: [/button/],
        message: '`cy.getByRole()` requires a role as its first argument, such as `\'button\'` or `\'heading\'`. You passed: `/button/`',
      },
      {
        title: 'throws when the role is empty',
        args: ['  '],
        message: '`cy.getByRole()` requires a role as its first argument',
      },
      {
        title: 'throws when the role has more than one word',
        args: ['switch checkbox'],
        message: '`cy.getByRole()` was passed the role `switch checkbox`, but a role is a single word with no spaces, such as `\'button\'`. Query one role at a time.',
      },
      {
        title: 'throws when the role has a line break',
        args: ['button\n'],
        message: 'but a role is a single word with no spaces',
      },
      {
        title: 'throws when the options are not an object',
        args: ['button', 'Help'],
        message: '`cy.getByRole()` only accepts an options object as its second argument. You passed: `Help`',
      },
      {
        title: 'throws on an option it does not accept, listing the ones it does',
        args: ['button', { description: 'x' }],
        message: '`cy.getByRole()` does not accept the `description` option. It accepts: `name`, `hidden`, `native`, `timeout`, `log`, `includeShadowDom`.',
      },
      {
        title: 'points to a Cypress alternative for an option it leaves out',
        args: ['heading', { level: 2 }],
        message: '`cy.getByRole()` does not accept the `level` option. To narrow the results by `level`, chain `.filter(\'h2, [aria-level=2]\')` instead. It accepts:',
      },
      {
        title: 'points to filters for both native and ARIA checked state',
        args: ['checkbox', { checked: true }],
        message: '`cy.getByRole()` does not accept the `checked` option. To narrow the results by `checked`, chain `.filter(\':checked\')` for a native checkbox or radio, or `.filter(\'[aria-checked=true]\')` for an element with a `role` attribute instead.',
      },
      {
        title: 'throws when name is not a matcher',
        args: ['button', { name: {} }],
        message: '`cy.getByRole()` only accepts a string, number, regular expression, or function for its `name` option. You passed: `{}`',
      },
      {
        title: 'throws when hidden is not a boolean',
        args: ['button', { hidden: 'yes' }],
        message: '`cy.getByRole()` only accepts a `boolean` for its `hidden` option. You passed: `yes`',
      },
      {
        title: 'throws when native is not a boolean',
        args: ['button', { native: 'yes' }],
        message: '`cy.getByRole()` only accepts a `boolean` for its `native` option. You passed: `yes`',
      },
      {
        title: 'throws when timeout is not a number',
        args: ['button', { timeout: 'abc' }],
        message: '`cy.getByRole()` only accepts a `number` for its `timeout` option. You passed: `abc`',
      },
      {
        title: 'throws when native is used with a role that HTML has no element for',
        args: ['tab', { native: true }],
        message: '`cy.getByRole()` was passed `native: true`, but HTML has no native element with the role `tab`, so only a `role` attribute can give an element that role. Remove `native: true` to find it.',
      },
    ], ({ title, args, message }) => {
      it(title, (done) => {
        expectError(message, done, (err) => {
          expect(err.docsUrl).to.eq('https://on.cypress.io/getbyrole')
        })

        cy.getByRole(...(args as [any, any?]))
      })
    })

    it('describes what it looked for and lists the accessible roles when nothing matches', (done) => {
      expectError('Expected to find an accessible native element with the role "button" and name "Missing" within the element: <section#explicit>, but never did.', done, (err) => {
        expect(err.message).to.include('Here are the accessible roles that were found, with the accessible name of each element:')
        expect(err.message).to.include('  - button: "Div button"')
        expect(err.message).to.include('  - tab: "Tab button"')
        expect(err.message).to.include('  - heading: "Explicit roles", "Div heading"')
        expect(err.message).not.to.include('native: false')
        expect(err.docsUrl).to.eq('https://on.cypress.io/getbyrole')
      })

      cy.get('#explicit').getByRole('button', { name: 'Missing' })
    })

    it('shows a regular expression name as written', (done) => {
      expectError('Expected to find an accessible native element with the role "button" and name /missing/i', done)

      cy.getByRole('button', { name: /missing/i })
    })

    it('leaves out "accessible" when hidden is true', (done) => {
      expectError('Expected to find an element with the role "slider", but never did.', done, (err) => {
        expect(err.message).to.include('Here are the roles that were found')
      })

      cy.getByRole('slider', { hidden: true, native: false })
    })

    it('leaves out "native" when native is false', (done) => {
      expectError('Expected to find an accessible element with the role "button" and name "Missing", but never did.', done)

      cy.getByRole('button', { name: 'Missing', native: false })
    })

    it('leaves out "native" for a role that HTML has no element for', (done) => {
      expectError('Expected to find an accessible element with the role "tab" and name "Missing", but never did.', done)

      cy.getByRole('tab', { name: 'Missing' })
    })

    it('suggests hidden: true when every element with a role is hidden', (done) => {
      expectError('No accessible elements with a role were found, but some elements may be hidden from the accessibility tree. To include them, pass `{ hidden: true }`.', done)

      cy.get('#visibility > div[aria-hidden]').getByRole('button')
    })

    it('explains when skipping role attributes is why nothing matched', (done) => {
      expectError('Expected to find an accessible native element with the role "button" within the element: <section#explicit>, but never did.', done, (err) => {
        expect(err.message).to.include('Some elements have the role "button" only through a `role` attribute, so they were skipped. The native elements for this role are: `<input>`, `<button>`. To include elements with a `role` attribute, pass `{ native: false }`.')
        expect(err.message).to.include('  - button: "Div button"')
      })

      cy.get('#explicit').getByRole('button')
    })

    it('suggests native: false only when an element with a role attribute would match the name', (done) => {
      expectError('Some elements have the role "button" only through a `role` attribute, so they were skipped.', done)

      cy.get('#explicit').getByRole('button', { name: 'Div button' })
    })

    it('uses "a" for a native element that may be hidden', (done) => {
      expectError('Expected to find a native element with the role "button" within the element: <section#explicit>, but never did.', done)

      cy.get('#explicit').getByRole('button', { hidden: true })
    })

    it('says so when there are no roles at all', (done) => {
      expectError('No elements with a role were found.', done)

      cy.get('#names > span').first().getByRole('button', { hidden: true })
    })

    it('limits how many names it lists for a role', (done) => {
      expectError(/- button: "Plain button", "Submit input", "Div button", "Save changes", "Close dialog" and \d+ more/, done)

      cy.getByRole('slider')
    })

    it('does not list the element it was chained off, which it never matches', (done) => {
      expectError('Expected to find an accessible native element with the role "navigation" within the element: <nav>, but never did.', done, (err) => {
        expect(err.message).to.include('  - link: "Profile", "Billing"')
        expect(err.message).not.to.include('- navigation:')
      })

      cy.get('nav').getByRole('navigation')
    })

    it('describes a shadow root it searched by its host', (done) => {
      expectError('Expected to find an accessible native element with the role "button" and name "Missing" within the shadow root of the element: <div#shadow-host>, but never did.', done, (err) => {
        expect(err.message).to.include('  - button: "Shadow button"')
      })

      cy.get('#shadow-host').shadow().getByRole('button', { name: 'Missing' })
    })

    it('describes an element that was expected not to exist', (done) => {
      expectError('Expected not to find an accessible native element with the role "banner", but continuously found it.', done)

      cy.getByRole('banner').should('not.exist')
    })

    it('fails when chained off a subject that is not an element', (done) => {
      expectError('`cy.getByRole()` failed because it requires', done)

      cy.wrap('text').getByRole('button')
    })
  })
})
