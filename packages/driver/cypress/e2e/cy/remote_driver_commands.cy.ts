// Every command that touches the AUT, one per test, run against a cross-origin AUT with the remote driver.
// A command the remote driver doesn't support yet is listed in UNSUPPORTED with the reason, and skipped.
const AUDIT_PAGE = 'http://www.foobar.com:3500/fixtures/remote-driver-audit.html'
const AUDIT_ORIGIN = 'http://www.foobar.com:3500'

const expectStatus = (text: string) => cy.get('#status').should('have.text', text)

const AUDIT_CASES: Record<string, Record<string, () => void>> = {
  queries: {
    first: () => cy.get('.item').first().should('have.text', 'One'),
    last: () => cy.get('.item').last().should('have.text', 'Three'),
    filter: () => cy.get('.item').filter('.two').should('have.text', 'Two'),
    not: () => cy.get('.item').not('.two').should('have.length', 2),
    children: () => cy.get('#list').children().should('have.length', 3),
    parent: () => cy.get('#two').parent().should('have.id', 'list'),
    parents: () => cy.get('#two').parents('body').should('have.length', 1),
    parentsUntil: () => cy.get('#two').parentsUntil('body').should('have.length', 1),
    closest: () => cy.get('#two').closest('ul').should('have.id', 'list'),
    siblings: () => cy.get('#two').siblings().should('have.length', 2),
    next: () => cy.get('#two').next().should('have.text', 'Three'),
    nextAll: () => cy.get('.item').first().nextAll().should('have.length', 2),
    nextUntil: () => cy.get('.item').first().nextUntil('.item:last').should('have.length', 1),
    prev: () => cy.get('#two').prev().should('have.text', 'One'),
    prevAll: () => cy.get('.item').last().prevAll().should('have.length', 2),
    prevUntil: () => cy.get('.item').last().prevUntil('.item:first').should('have.length', 1),
    shadow: () => cy.get('#host').shadow().find('#in-shadow').should('have.text', 'In shadow'),
    includeShadowDom: () => cy.get('#in-shadow', { includeShadowDom: true }).should('have.text', 'In shadow'),
    root: () => cy.root().find('#two').should('have.text', 'Two'),
    focused: () => {
      cy.get('#text').click()
      cy.focused().should('have.id', 'text')
    },
    document: () => cy.document().its('title').should('eq', 'Audit Page'),
    'document find': () => cy.document().find('#two').should('have.text', 'Two'),
    title: () => cy.title().should('eq', 'Audit Page'),
    url: () => cy.url().should('eq', AUDIT_PAGE),
    location: () => cy.location('pathname').should('eq', '/fixtures/remote-driver-audit.html'),
    hash: () => {
      cy.visit(`${AUDIT_PAGE}#section`)
      cy.hash().should('eq', '#section')
    },
    getByRole: () => cy.getByRole('button', { name: 'Role button', native: false }).should('have.id', 'role-button'),
    'getByRole with a RegExp name': () => cy.getByRole('button', { name: /^submit$/i }).should('have.id', 'submit-button'),
    'getByRole within': () => {
      cy.get('#form').within(() => {
        cy.getByRole('checkbox').should('have.id', 'check')
      })
    },
    'as and get(@alias)': () => {
      cy.get('#two').as('two')
      cy.get('@two').should('have.text', 'Two')
    },
    its: () => cy.get('.item').its('length').should('eq', 3),
    invoke: () => cy.get('#two').invoke('text').should('eq', 'Two'),
    each: () => {
      const texts: string[] = []

      cy.get('.item').each(($el) => {
        texts.push($el.text())
      })

      cy.wrap(texts).should('deep.equal', ['One', 'Two', 'Three'])
    },
    within: () => {
      cy.get('#list').within(() => {
        cy.get('.two').should('have.text', 'Two')
      })
    },
    'then($el)': () => {
      cy.get('#two').then(($el) => {
        expect($el.text()).to.eq('Two')
      })
    },
    'its an element\'s property': () => cy.get('#text').its('0.value').should('eq', ''),
    'its an index yields the element': () => cy.get('.item').its(1).should('have.text', 'Two'),
    'invoke a method that returns a value': () => cy.get('#two').invoke('attr', 'id').should('eq', 'two'),
    'invoke a method that changes the element': () => {
      cy.get('#text').invoke('val', 'from invoke').should('have.value', 'from invoke')
    },
    'each acts on each element': () => {
      cy.get('.item').each(($el) => {
        if ($el.hasClass('two')) {
          cy.wrap($el).click()
        }
      })

      expectStatus('item:Two')
    },
    'within scopes contains and root': () => {
      cy.get('#list').within(() => {
        cy.contains('Three').should('have.class', 'item')
        cy.root().should('have.id', 'list')
      })
    },
    'a snapshot fails loudly on what it can\'t answer': () => {
      cy.get('#two').then(($el) => {
        expect(() => $el[0]).to.throw('is not supported on a subject from `experimentalRemoteDriver`')
        expect(() => $el.css('color')).to.throw('`.css(\'color\')` is not supported')
        expect(() => $el.find('span')).to.throw('`.find()` is not supported')
      })
    },
    'should(callback)': () => {
      cy.get('#two').should(($el) => {
        expect($el).to.have.text('Two')
      })
    },
  },
  actions: {
    click: () => {
      cy.get('#role-button').click()
      expectStatus('clicked')
    },
    dblclick: () => {
      cy.get('#role-button').dblclick()
      expectStatus('dblclicked')
    },
    rightclick: () => {
      cy.get('#role-button').rightclick()
      expectStatus('rightclicked')
    },
    type: () => cy.get('#text').type('abc').should('have.value', 'abc'),
    clear: () => {
      cy.get('#text').type('abc')
      cy.get('#text').clear().should('have.value', '')
    },
    'type after clear': () => cy.get('#text').type('abc').clear().type('xyz').should('have.value', 'xyz'),
    check: () => {
      cy.get('#check').check()
      expectStatus('checked:true')
    },
    uncheck: () => {
      cy.get('#check').click()
      cy.get('#check').uncheck()
      expectStatus('checked:false')
    },
    select: () => {
      cy.get('#fruit').select('banana')
      expectStatus('selected:banana')
    },
    selectFile: () => {
      cy.get('#file').selectFile({ contents: Cypress.Buffer.from('audit'), fileName: 'audit.txt' })
      expectStatus('file:audit.txt')
    },
    focus: () => {
      cy.get('#text').focus()
      expectStatus('focus:text')
    },
    blur: () => {
      cy.get('#text').click()
      cy.get('#text').blur()
      expectStatus('blur:text')
    },
    submit: () => {
      cy.get('#form').submit()
      expectStatus('submitted:')
    },
    trigger: () => {
      cy.get('#two').trigger('custom-event')
      expectStatus('custom-event')
    },
    scrollIntoView: () => {
      cy.get('#far').scrollIntoView()
      expectStatus('scrolled')
    },
    'scrollTo an element': () => {
      cy.get('#scroller').scrollTo('bottom')
      expectStatus('scrolled')
    },
    'scrollTo the window': () => {
      cy.scrollTo('bottom')
      cy.get('#window-scroll').should('have.text', 'window-scrolled')
    },
    press: () => {
      cy.get('#text').click()
      cy.press(Cypress.Keyboard.Keys.TAB)
      expectStatus('blur:text')
    },
  },
  navigation: {
    reload: () => {
      cy.get('#text').type('abc')
      cy.reload()
      cy.get('#text').should('have.value', '')
    },
    go: () => {
      cy.get('#next-page').click()
      cy.get('#page').should('have.text', '2')
      cy.go('back')
      cy.get('#page').should('have.text', '1')
    },
  },
  'cookies and storage': {
    getCookie: () => cy.getCookie('audit').should('have.property', 'value', '1'),
    getCookies: () => cy.getCookies().should('have.length.at.least', 1),
    getAllCookies: () => cy.getAllCookies().should('have.length.at.least', 1),
    setCookie: () => {
      cy.setCookie('extra', 'yes')
      cy.getCookie('extra').should('have.property', 'value', 'yes')
    },
    clearCookie: () => {
      cy.clearCookie('audit')
      cy.getCookie('audit').should('be.null')
    },
    clearCookies: () => {
      cy.clearCookies()
      cy.getCookie('audit').should('be.null')
    },
    clearAllCookies: () => {
      cy.clearAllCookies()
      cy.getAllCookies().should('have.length', 0)
    },
    getAllLocalStorage: () => cy.getAllLocalStorage().should('deep.include', { [AUDIT_ORIGIN]: { audit: 'local' } }),
    clearLocalStorage: () => {
      cy.clearLocalStorage()
      cy.getAllLocalStorage().should('deep.equal', {})
    },
    clearAllLocalStorage: () => {
      cy.clearAllLocalStorage()
      cy.getAllLocalStorage().should('deep.equal', {})
    },
    getAllSessionStorage: () => cy.getAllSessionStorage().should('deep.include', { [AUDIT_ORIGIN]: { audit: 'session' } }),
    clearAllSessionStorage: () => {
      cy.clearAllSessionStorage()
      cy.getAllSessionStorage().should('deep.equal', {})
    },
  },
  assertions: {
    'match a simple selector': () => cy.get('#two').should('match', 'li.item.two').and('match', 'p, #two').and('not.match', 'ul'),
    'match an unsupported selector': () => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('is not supported on a subject from `experimentalRemoteDriver`')
      })

      cy.get('#two').should('match', 'ul > li').then(() => {
        throw new Error('expected the assertion to fail')
      })
    },
  },
  other: {
    'screenshot of the page': () => cy.screenshot('remote-driver-audit-page'),
    'screenshot of an element': () => cy.get('#two').screenshot('remote-driver-audit-element'),
    viewport: () => {
      cy.viewport(400, 600)
      expectStatus('width:400')
    },
    session: () => {
      cy.session('remote-driver-audit', () => {
        cy.visit(AUDIT_PAGE)
        cy.setCookie('session-cookie', 'kept')
      })

      cy.visit(AUDIT_PAGE)
      cy.getCookie('session-cookie').should('have.property', 'value', 'kept')
    },
  },
}

const UNSUPPORTED: Record<string, string> = {}

// unsupported in a browser for reasons the remote driver doesn't change, or a bug in one browser
const UNSUPPORTED_IN: Record<string, { browser: string, reason: string }> = {
  press: { browser: 'webkit', reason: 'cy.press() isn\'t supported in WebKit' },
}

describe('remote driver: commands against a cross-origin AUT', { experimentalRemoteDriver: true, retries: 0, defaultCommandTimeout: 3000 }, () => {
  beforeEach(() => {
    cy.visit(AUDIT_PAGE)
  })

  it('fails cy.origin, which a cross-origin AUT doesn\'t need', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.origin()` is not available when `experimentalRemoteDriver` is enabled')
      done()
    })

    cy.origin(AUDIT_ORIGIN, () => {
      cy.get('#two')
    })
  })

  Object.entries(AUDIT_CASES).forEach(([group, cases]) => {
    describe(group, () => {
      Object.entries(cases).forEach(([name, run]) => {
        const reason = UNSUPPORTED[name] ?? (Cypress.isBrowser(UNSUPPORTED_IN[name]?.browser ?? '') ? UNSUPPORTED_IN[name].reason : undefined)

        if (reason) {
          // TODO: remove each entry from UNSUPPORTED once the remote driver supports the command
          it.skip(`${name} (unsupported: ${reason})`, run)

          return
        }

        it(name, run)
      })
    })
  })
})
