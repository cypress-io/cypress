const { assertLogLength } = require('../../support/utils')
const { stripIndent } = require('common-tags')
const { Promise } = Cypress

const isWebkit = Cypress.isBrowser('webkit')

describe('src/cy/commands/cookies - no stub', () => {
  const setCookies = () => {
    cy.log('set cookies')
    cy.setCookie('key1', 'value1', { domain: 'www.foobar.com', log: false })
    cy.setCookie('key2', 'value2', { domain: 'foobar.com', log: false })
    cy.setCookie('key3', 'value3', { domain: 'www.barbaz.com', log: false })
    cy.setCookie('key4', 'value4', { domain: '.www.barbaz.com', log: false })
    cy.setCookie('key5', 'value5', { domain: 'barbaz.com', log: false })
    cy.setCookie('key6', 'value6', { domain: '.barbaz.com', log: false })
    cy.setCookie('key7', 'value7', { domain: 'www2.barbaz.com', log: false })
    cy.setCookie('key8', 'value8', { domain: 'www2.foobar.com', log: false })
  }

  context('#getCookies', () => {
    it('returns cookies from only the bare domain matching the AUT by default when AUT is an apex domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookies().then((cookies) => {
        expect(cookies).to.have.length(2)

        const sortedCookies = Cypress._.sortBy(cookies, 'name')

        expect(sortedCookies[0].name).to.equal('key5')
        expect(sortedCookies[0].domain).to.match(/\.?barbaz\.com/)
        expect(sortedCookies[1].name).to.equal('key6')
        expect(sortedCookies[1].domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')

        cy.getCookies().then((cookies) => {
          expect(cookies).to.have.length(1)
          expect(cookies[0].name).to.equal('key2')
          expect(cookies[0].domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns cookies from the subdomain and bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.getCookies().then((cookies) => {
        expect(cookies).to.have.length(4)

        const sortedCookies = Cypress._.sortBy(cookies, 'name')

        expect(sortedCookies[0].name).to.equal('key3')
        expect(sortedCookies[0].domain).to.match(/\.?www\.barbaz\.com/)
        expect(sortedCookies[1].name).to.equal('key4')
        expect(sortedCookies[1].domain).to.match(/\.?www\.barbaz\.com/)
        expect(sortedCookies[2].name).to.equal('key5')
        expect(sortedCookies[2].domain).to.match(/\.?barbaz\.com/)
        expect(sortedCookies[3].name).to.equal('key6')
        expect(sortedCookies[3].domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookies().then((cookies) => {
          const sortedCookies = Cypress._.sortBy(cookies, 'name')

          expect(sortedCookies).to.have.length(2)
          expect(sortedCookies[0].name).to.equal('key1')
          expect(sortedCookies[0].domain).to.match(/\.?www\.foobar\.com/)
          expect(sortedCookies[1].name).to.equal('key2')
          expect(sortedCookies[1].domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns cookies for the specified domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookies({ domain: 'www.foobar.com' }).then((cookies) => {
        expect(cookies).to.have.length(2)
        expect(cookies[0].name).to.equal('key1')
        expect(cookies[0].domain).to.match(/\.?www\.foobar\.com/)
        expect(cookies[1].name).to.equal('key2')
        expect(cookies[1].domain).to.match(/\.?foobar\.com/)
      })

      cy.getCookies({ domain: 'barbaz.com' }).then((cookies) => {
        expect(cookies).to.have.length(2)

        const sortedCookies = Cypress._.sortBy(cookies, 'name')

        expect(sortedCookies[0].name).to.equal('key5')
        expect(sortedCookies[0].domain).to.match(/\.?barbaz\.com/)
        expect(sortedCookies[1].name).to.equal('key6')
        expect(sortedCookies[1].domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookies({ domain: 'www.barbaz.com' }).then((cookies) => {
          expect(cookies).to.have.length(4)

          const sortedCookies = Cypress._.sortBy(cookies, 'name')

          expect(sortedCookies[0].name).to.equal('key3')
          expect(sortedCookies[0].domain).to.match(/\.?www\.barbaz\.com/)
          expect(sortedCookies[1].name).to.equal('key4')
          expect(sortedCookies[1].domain).to.match(/\.?www\.barbaz\.com/)
          expect(sortedCookies[2].name).to.equal('key5')
          expect(sortedCookies[2].domain).to.match(/\.?barbaz\.com/)
          expect(sortedCookies[3].name).to.equal('key6')
          expect(sortedCookies[3].domain).to.match(/\.?barbaz\.com/)
        })
      })
    })
  })

  context('#getAllCookies', () => {
    it('returns cookies from all domains', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getAllCookies().then((cookies) => {
        expect(cookies).to.have.length(8)

        const sortedCookies = Cypress._.sortBy(cookies, 'name').map((cookie) => `${cookie.name}=${cookie.value}`)

        expect(sortedCookies).to.deep.equal([
          'key1=value1',
          'key2=value2',
          'key3=value3',
          'key4=value4',
          'key5=value5',
          'key6=value6',
          'key7=value7',
          'key8=value8',
        ])
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')

        cy.getAllCookies().then((cookies) => {
          expect(cookies).to.have.length(8)

          const sortedCookies = Cypress._.sortBy(cookies, 'name').map((cookie) => `${cookie.name}=${cookie.value}`)

          expect(sortedCookies).to.deep.equal([
            'key1=value1',
            'key2=value2',
            'key3=value3',
            'key4=value4',
            'key5=value5',
            'key6=value6',
            'key7=value7',
            'key8=value8',
          ])
        })
      })
    })
  })

  context('#getCookie', () => {
    const setCookies = () => {
      cy.log('set cookies')
      cy.setCookie('key', 'www.barbaz.com value', { domain: 'www.barbaz.com', log: false })
      cy.setCookie('key', 'barbaz.com value', { domain: 'barbaz.com', log: false })
      cy.setCookie('key', 'www.foobar.com value', { domain: 'www.foobar.com', log: false })
      cy.setCookie('key', 'foobar.com value', { domain: 'foobar.com', log: false })
    }

    it('returns the cookie from the domain matching the AUT by default when AUT is an apex domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookie('key').then((cookie) => {
        expect(cookie.value).to.equal('barbaz.com value')
        expect(cookie.domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')

        cy.getCookie('key').then((cookie) => {
          expect(cookie.value).to.equal('foobar.com value')
          expect(cookie.domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('can return the cookie from the subdomain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'www.barbaz.com value', { domain: 'www.barbaz.com', log: false })

      cy.getCookie('key').then((cookie) => {
        expect(cookie.value).to.equal('www.barbaz.com value')
        expect(cookie.domain).to.match(/\.?www\.barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'www.foobar.com value', { domain: 'www.foobar.com', log: false })

        cy.getCookie('key').then((cookie) => {
          expect(cookie.value).to.equal('www.foobar.com value')
          expect(cookie.domain).to.match(/\.?www\.foobar\.com/)
        })
      })
    })

    it('can return the cookie from the bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'barbaz.com value', { domain: 'barbaz.com', log: false })

      cy.getCookie('key').then((cookie) => {
        expect(cookie.value).to.equal('barbaz.com value')
        expect(cookie.domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'foobar.com value', { domain: 'foobar.com', log: false })

        cy.getCookie('key').then((cookie) => {
          expect(cookie.value).to.equal('foobar.com value')
          expect(cookie.domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns the cookie from the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookie('key', { domain: 'www.foobar.com' }).then((cookie) => {
        expect(cookie.value).to.equal('www.foobar.com value')
        expect(cookie.domain).to.match(/\.?www\.foobar\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookie('key', { domain: 'www.barbaz.com' }).then((cookie) => {
          expect(cookie.value).to.equal('www.barbaz.com value')
          expect(cookie.domain).to.match(/\.?www\.barbaz\.com/)
        })
      })
    })
  })

  context('#setCookie', () => {
    it('sets the cookie on the domain matching the AUT by default', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'value')

      cy.getCookie('key').its('domain').should('match', /\.?www\.barbaz\.com/)
      // domain is exact
      cy.getCookie('key', { domain: 'barbaz.com' }).should('be.null')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'value')

        cy.getCookie('key').its('domain').should('match', /\.?www\.foobar\.com/)
        // domain is exact
        cy.getCookie('key', { domain: 'foobar.com' }).should('be.null')
      })
    })

    it('sets the cookie on the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('foo', 'bar', { domain: 'www.foobar.com' })

      cy.getCookie('foo', { domain: 'www.foobar.com' })
      .its('domain').should('match', /\.?www\.foobar\.com/)

      // domain is exact
      cy.getCookie('key', { domain: 'foobar.com' }).should('be.null')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('foo', 'bar', { domain: 'barbaz.com' })

        cy.getCookie('foo', { domain: 'barbaz.com' })
        .its('domain').should('match', /\.?barbaz\.com/)

        // domain is exact
        cy.getCookie('key', { domain: 'barbaz.com' }).should('be.null')
      })
    })
  })

  context('#clearCookies', () => {
    it('clears cookies from only the bare domain matching the AUT by default when AUT is an apex domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.clearCookies()

      cy.getCookie('key1', { domain: 'www.foobar.com' }).should('exist')
      cy.getCookie('key2', { domain: 'foobar.com' }).should('exist')
      cy.getCookie('key3', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key4', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key5').should('not.exist')
      cy.getCookie('key6').should('not.exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')
        // put back cookies removed above
        cy.setCookie('key5', 'value5', { domain: 'barbaz.com' })
        cy.setCookie('key6', 'value6', { domain: 'barbaz.com' })

        cy.clearCookies()

        cy.getCookie('key1', { domain: 'www.foobar.com' }).should('exist')
        cy.getCookie('key2').should('be.null')
        cy.getCookie('key3', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key4', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key5', { domain: 'barbaz.com' }).should('exist')
        cy.getCookie('key6', { domain: 'barbaz.com' }).should('exist')
      })
    })

    it('clears cookies from the subdomain and bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.clearCookies()

      cy.getCookie('key1', { domain: 'www.foobar.com' }).should('exist')
      cy.getCookie('key2', { domain: 'foobar.com' }).should('exist')
      cy.getCookie('key3').should('not.exist')
      cy.getCookie('key4').should('not.exist')
      cy.getCookie('key5').should('not.exist')
      cy.getCookie('key6').should('not.exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        // put back cookies removed above
        cy.setCookie('key3', 'value3', { domain: 'www.barbaz.com' })
        cy.setCookie('key4', 'value4', { domain: 'www.barbaz.com' })
        cy.setCookie('key5', 'value5', { domain: 'barbaz.com' })
        cy.setCookie('key6', 'value6', { domain: 'barbaz.com' })

        cy.clearCookies()

        cy.getCookie('key1').should('be.null')
        cy.getCookie('key2').should('be.null')
        cy.getCookie('key3', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key4', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key5', { domain: 'barbaz.com' }).should('exist')
        cy.getCookie('key6', { domain: 'barbaz.com' }).should('exist')
      })
    })

    it('clears the cookies on the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.clearCookies({ domain: 'www.foobar.com' })

      cy.getCookie('key1').should('be.null')
      cy.getCookie('key2').should('be.null')
      cy.getCookie('key3', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key4', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key5', { domain: 'barbaz.com' }).should('exist')
      cy.getCookie('key6', { domain: 'barbaz.com' }).should('exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        // put back cookies removed above
        cy.setCookie('key1', 'value1')
        cy.setCookie('key2', 'value2', { domain: 'foobar.com' })

        cy.clearCookies({ domain: 'www.barbaz.com' })

        cy.getCookie('key1', { domain: 'www.foobar.com' }).should('exist')
        cy.getCookie('key2', { domain: 'foobar.com' }).should('exist')
        cy.getCookie('key3').should('not.exist')
        cy.getCookie('key4').should('not.exist')
        cy.getCookie('key5').should('not.exist')
        cy.getCookie('key6').should('not.exist')
      })
    })
  })

  context('#clearAllCookies', () => {
    it('clears cookies from all domains', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.clearAllCookies()

      cy.getAllCookies().its('length').should('equal', 0)

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')
        // put back cookies removed above
        cy.setCookie('key1', 'value1', { domain: 'www.foobar.com', log: false })
        cy.setCookie('key2', 'value2', { domain: 'foobar.com', log: false })
        cy.setCookie('key3', 'value3', { domain: 'www.barbaz.com', log: false })
        cy.setCookie('key4', 'value4', { domain: '.www.barbaz.com', log: false })
        cy.setCookie('key5', 'value5', { domain: 'barbaz.com', log: false })
        cy.setCookie('key6', 'value6', { domain: '.barbaz.com', log: false })
        cy.setCookie('key7', 'value7', { domain: 'www2.barbaz.com', log: false })
        cy.setCookie('key8', 'value8', { domain: 'www2.foobar.com', log: false })

        cy.clearAllCookies()

        cy.getAllCookies().its('length').should('equal', 0)
      })
    })
  })

  context('#clearCookie', () => {
    const setCookies = () => {
      cy.log('set cookies')
      cy.setCookie('key', 'www.barbaz.com value', { domain: 'www.barbaz.com', log: false })
      cy.setCookie('key', 'barbaz.com value', { domain: 'barbaz.com', log: false })
      cy.setCookie('key', 'www.foobar.com value', { domain: 'www.foobar.com', log: false })
      cy.setCookie('key', 'foobar.com value', { domain: 'foobar.com', log: false })
    }

    it('clears the cookie from the domain matching the AUT by default when AUT is an apex domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.clearCookie('key')

      cy.getCookie('key').should('be.null')
      cy.getCookie('key', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key', { domain: 'www.foobar.com' }).should('exist')
      cy.getCookie('key', { domain: 'foobar.com' }).should('exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')
        // put back cookie removed above
        cy.setCookie('key', 'value1', { domain: 'barbaz.com' })

        cy.clearCookie('key')

        cy.getCookie('key').should('be.null')
        cy.getCookie('key', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key', { domain: 'barbaz.com' }).should('exist')
        cy.getCookie('key', { domain: 'www.foobar.com' }).should('exist')
      })
    })

    it('can clear the cookie from the subdomain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'www.barbaz.com value', { domain: 'www.barbaz.com', log: false })

      cy.clearCookie('key')

      cy.getCookie('key').should('not.exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'www.foobar.com value', { domain: 'www.foobar.com', log: false })

        cy.clearCookie('key')

        cy.getCookie('key').should('not.exist')
      })
    })

    it('can clear the cookie from the bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'barbaz.com value', { domain: 'barbaz.com', log: false })

      cy.clearCookie('key')

      cy.getCookie('key').should('not.exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'foobar.com value', { domain: 'foobar.com', log: false })

        cy.clearCookie('key')

        cy.getCookie('key').should('not.exist')
      })
    })

    it('clears the cookie on the specified domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.clearCookie('key', { domain: 'foobar.com' })

      cy.getCookie('key', { domain: 'foobar.com' }).should('be.null')
      cy.getCookie('key', { domain: 'www.foobar.com' }).should('exist')
      cy.getCookie('key', { domain: 'www.barbaz.com' }).should('exist')
      cy.getCookie('key', { domain: 'barbaz.com' }).should('exist')

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'value1')

        cy.clearCookie('key', { domain: 'barbaz.com' })

        cy.getCookie('key', { domain: 'barbaz.com' }).should('be.null')
        cy.getCookie('key', { domain: 'www.barbaz.com' }).should('exist')
        cy.getCookie('key', { domain: 'www.foobar.com' }).should('exist')
        cy.getCookie('key', { domain: 'foobar.com' }).should('exist')
      })
    })
  })

  it('sets the cookie on the specified domain as hostOnly and validates hostOnly property persists through related commands that fetch cookies', () => {
    const isWebkit = Cypress.browser.name.includes('webkit')

    cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
    cy.setCookie('foo', 'bar', { hostOnly: true })

    cy.getCookie('foo').its('domain').should('eq', 'www.barbaz.com')
    if (!isWebkit) {
      cy.getCookie('foo').its('hostOnly').should('eq', true)
    }

    cy.getCookies().then((cookies) => {
      expect(cookies).to.have.lengthOf(1)

      const cookie = cookies[0]

      expect(cookie).to.have.property('domain', 'www.barbaz.com')
      if (!isWebkit) {
        expect(cookie).to.have.property('hostOnly', true)
      }
    })

    cy.getAllCookies().then((cookies) => {
      expect(cookies).to.have.lengthOf(1)

      const cookie = cookies[0]

      expect(cookie).to.have.property('domain', 'www.barbaz.com')
      if (!isWebkit) {
        expect(cookie).to.have.property('hostOnly', true)
      }
    })
  })
})

describe('src/cy/commands/cookies', () => {
  beforeEach(() => {
    // call through normally on everything
    cy.stub(Cypress, 'automation').rejects(new Error('Cypress.automation was not stubbed'))

    cy.visit('http://localhost:3500/fixtures/generic.html')
  })

  context('test:before:run:async', () => {
    it('clears cookies before each test run', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )

        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies',
          [{ domain: 'localhost', name: 'foo' }],
        )
      })
    })

    it('does not call clear:cookies when get:cookies returns empty array', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('does not attempt to time out', () => {
      Cypress.automation
      .withArgs('get:cookies', { domain: 'localhost' })
      .resolves([{ name: 'foo' }])
      .withArgs('clear:cookies', [{ domain: 'localhost', name: 'foo' }])
      .resolves([])

      const timeout = cy.spy(Promise.prototype, 'timeout')

      Cypress.emitThen('test:before:run:async', {
        id: 'r1',
        currentRetry: 1,
      })
      .then(() => {
        expect(timeout).not.to.be.called
      })
    })
  })

  context('#getCookies', () => {
    it('returns array of cookies', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.getCookies().should('deep.eq', []).then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookies',
          { domain: 'localhost' },
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.getCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.getCookies()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookies')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.getCookies({ domain: true })
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', () => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.getCookies()\` had an unexpected error reading cookies from ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.getCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.getCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/getcookies')

          done()
        })

        cy.getCookies({ timeout: 50 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([
          { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false },
        ])
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.hiddenLog = log
          }
        })

        cy.getCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookies') {
            this.hiddenLog = log
          }
        })

        cy.getCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('getCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.getCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.getCookies().then(function (cookies) {
          expect(cookies).to.deep.eq([{ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false }])
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookies)
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })
  })

  context('#getAllCookies', () => {
    it('returns array of cookies', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.getAllCookies().should('deep.eq', []).then(() => {
        expect(Cypress.automation).to.be.calledWith('get:cookies')
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', { responseTimeout: 2500 }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getAllCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getAllCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.getAllCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', { defaultCommandTimeout: 50 }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getAllCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', () => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.getAllCookies()\` had an unexpected error reading cookies from ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.getAllCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getAllCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.getAllCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/getallcookies')

          done()
        })

        cy.getAllCookies({ timeout: 50 })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getAllCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies')
        .resolves([
          { name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false },
        ])
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getAllCookies') {
            this.hiddenLog = log
          }
        })

        cy.getAllCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getAllCookies') {
            this.hiddenLog = log
          }
        })

        cy.getAllCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('getAllCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.getAllCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.getAllCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.getAllCookies().then(function (cookies) {
          expect(cookies).to.deep.eq([{ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false }])
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookies)
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })
  })

  context('#getCookie', () => {
    it('returns single cookie by name', () => {
      Cypress.automation.withArgs('get:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
      })

      cy.getCookie('foo').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'get:cookie',
          { domain: 'localhost', name: 'foo' },
        )
      })
    })

    it('returns null when no cookie was found', () => {
      Cypress.automation.withArgs('get:cookie').resolves(null)

      cy.getCookie('foo').should('be.null')
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.getCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.getCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookie')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)

          expect(lastLog.get('error').message).to.contain(`\`cy.getCookie()\` had an unexpected error reading the requested cookie from ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.getCookie('foo')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('getCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('`cy.getCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/getcookie')

          done()
        })

        cy.getCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.getCookie()` must be passed a string argument for name.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.getCookie(123)
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.getCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/getcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.getCookie('foo', { domain: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.asserts = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.lastLog = log
          }

          if (attrs.name === 'assert') {
            this.asserts.push(log)
          }
        })

        Cypress.automation
        .withArgs('get:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false,
        })
        .withArgs('get:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.hiddenLog = log
          }
        })

        cy.getCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'getCookie') {
            this.hiddenLog = log
          }
        })

        cy.getCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('getCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('only logs assertion once when should is invoked', () => {
        cy.getCookie('foo').should('exist').then(function () {
          expect(this.asserts.length).to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('has correct message', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('foo')
        })
      })

      it('snapshots immediately', () => {
        cy.getCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.getCookie('foo').then(function (cookie) {
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false })
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookie)
        })
      })

      it('#consoleProps when no cookie found', () => {
        cy.getCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Note']).to.eq('No cookie with the name: \'bar\' was found.')
        })
      })
    })
  })

  context('#setCookie', () => {
    beforeEach(() => {
      cy.stub(Cypress.utils, 'addTwentyYears').returns(12345)
    })

    it('returns set cookie', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })

      cy.setCookie('foo', 'bar').should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: false, httpOnly: false, expiry: 12345,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, hostOnly: false, expiry: 12345, sameSite: undefined },
        )
      })
    })

    it('can change options', () => {
      Cypress.automation.withArgs('set:cookie').resolves({
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })

      cy.setCookie('foo', 'bar', { domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987 }).should('deep.eq', {
        name: 'foo', value: 'bar', domain: 'brian.dev.local', path: '/foo', secure: true, httpOnly: true, expiry: 987,
      })
      .then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'set:cookie',
          { domain: 'brian.dev.local', name: 'foo', value: 'bar', path: '/foo', secure: true, httpOnly: true, hostOnly: false, expiry: 987, sameSite: undefined },
        )
      })
    })

    it('does not mutate options', () => {
      Cypress.automation.resolves()
      const options = {}

      cy.setCookie('foo', 'bar', {}).then(() => {
        expect(options).deep.eq({})
      })
    })

    it('can set cookies with sameSite', () => {
      Cypress.automation.restore()
      Cypress.utils.addTwentyYears.restore()

      cy.setCookie('one', 'bar', { sameSite: 'none', secure: true })
      cy.getCookie('one').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('two', 'bar', { sameSite: 'no_restriction', secure: true })
      cy.getCookie('two').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('three', 'bar', { sameSite: 'Lax' })
      cy.getCookie('three').should('include', { sameSite: 'lax' })

      cy.setCookie('four', 'bar', { sameSite: 'Strict' })
      cy.getCookie('four').should('include', { sameSite: 'strict' })

      cy.setCookie('five', 'bar')

      // TODO(webkit): pw webkit has no "unspecified" state, need a patched binary
      if (Cypress.isBrowser('webkit')) {
        cy.getCookie('five').should('include', { sameSite: 'no_restriction' })
      } else if (Cypress.isBrowser('firefox')) {
        cy.getCookie('five').should('include', { sameSite: 'lax' })
      } else {
        cy.getCookie('five').should('not.have.property', 'sameSite')
      }
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.setCookie('foo', 'bar', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.setCookie('foo', 'bar').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('set:cookie')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.include('some err message')
          expect(lastLog.get('error').name).to.eq('CypressError')

          done()
        })

        cy.setCookie('foo', 'bar')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('setCookie')
          expect(lastLog.get('message')).to.eq('foo, bar')
          expect(err.message).to.include('`cy.setCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/setcookie')

          done()
        })

        cy.setCookie('foo', 'bar', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed two string arguments for `name` and `value`.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.setCookie(123)
      })

      it('requires a string value', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed two string arguments for `name` and `value`.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.setCookie('foo', 123)
      })

      it('when an invalid samesite prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(stripIndent`
            If a \`sameSite\` value is supplied to \`cy.setCookie()\`, it must be a string from the following list:
              > no_restriction, lax, strict
            You passed:
              > bad`)

          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.setCookie('foo', 'bar', { sameSite: 'bad' })
      })

      it('when samesite=none is supplied and secure is not set', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq(stripIndent`
            Only cookies with the \`secure\` flag set to \`true\` can use \`sameSite: 'None'\`.

            Pass \`secure: true\` to \`cy.setCookie()\` to set a cookie with \`sameSite: 'None'\`.`)

          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.setCookie('foo', 'bar', { sameSite: 'None' })
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.setCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/setcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.setCookie('foo', 'bar', { domain: true })
      })

      context('when setting an invalid cookie', () => {
        it('throws an error if the backend responds with an error', (done) => {
          const err = new Error('backend could not set cookie')

          Cypress.automation.withArgs('set:cookie').rejects(err)

          cy.on('fail', (err) => {
            expect(Cypress.automation.withArgs('set:cookie')).to.be.calledOnce
            expect(err.message).to.contain('unexpected error setting the requested cookie')
            expect(err.message).to.contain(err.message)

            done()
          })

          // browser backend should yell since this is invalid
          cy.setCookie('foo', ' bar')
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('set:cookie', {
          domain: 'localhost', name: 'foo', value: 'bar', path: '/', secure: false, httpOnly: false, hostOnly: false, expiry: 12345, sameSite: undefined,
        })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true,
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.hiddenLog = log
          }
        })

        cy.setCookie('foo', 'bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'setCookie') {
            this.hiddenLog = log
          }
        })

        cy.setCookie('foo', 'bar', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('setCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.setCookie('foo', 'bar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.setCookie('foo', 'bar').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.setCookie('foo', 'bar').then(function (cookie) {
          expect(cookie).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: true })
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.deep.eq(cookie)
        })
      })
    })
  })

  context('#clearCookie', () => {
    it('returns null', () => {
      Cypress.automation.withArgs('clear:cookie').resolves(null)

      cy.clearCookie('foo').should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookie',
          { domain: 'localhost', name: 'foo' },
        )
      })
    })

    describe('timeout', () => {
      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookie('foo').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves(null)

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookie('foo', { timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.clearCookie('foo').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('clear:cookie')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookie()\` had an unexpected error clearing the requested cookie in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')

          done()
        })

        cy.clearCookie('foo')
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookie')
          expect(lastLog.get('message')).to.eq('foo')
          expect(err.message).to.eq('`cy.clearCookie()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/clearcookie')

          done()
        })

        cy.clearCookie('foo', { timeout: 50 })
      })

      it('requires a string name', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.eq('`cy.clearCookie()` must be passed a string argument for name.')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookie(123)
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.clearCookie()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookie')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookie('foo', { domain: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('clear:cookie', { domain: 'localhost', name: 'foo' })
        .resolves({
          name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false,
        })
        .withArgs('clear:cookie', { domain: 'localhost', name: 'bar' })
        .resolves(null)
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.hiddenLog = log
          }
        })

        cy.clearCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookie') {
            this.hiddenLog = log
          }
        })

        cy.clearCookie('foo', { log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('clearCookie')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.clearCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearCookie('foo').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.clearCookie('foo').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookie']).to.deep.eq({ name: 'foo', value: 'bar', domain: 'localhost', path: '/', secure: true, httpOnly: false, hostOnly: false })
        })
      })

      it('#consoleProps when no matching cookie was found', () => {
        cy.clearCookie('bar').then(function (cookie) {
          expect(cookie).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookie']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookie with the name: \'bar\' was found or removed.')
        })
      })
    })
  })

  context('#clearCookies', () => {
    it('returns null', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().should('be.null')
    })

    it('does not call \'clear:cookies\' when no cookies were returned', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearCookies().then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('calls \'clear:cookies\' with all cookies', () => {
      Cypress.automation
      .withArgs('get:cookies')
      .resolves([
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'localhost' },
        { name: 'baz', domain: 'localhost' },
      ])
      .withArgs('clear:cookies', [
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'localhost' },
        { name: 'baz', domain: 'localhost' },
      ])
      .resolves({
        name: 'foo',
      })

      cy
      .clearCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies', [
            { name: 'foo', domain: 'localhost' },
            { name: 'bar', domain: 'localhost' },
            { name: 'baz', domain: 'localhost' },
          ],
        )
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        Cypress.automation
        .withArgs('get:cookies')
        .resolves([{}])
        .withArgs('clear:cookies')
        .resolves({})
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.clearCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')
          expect(cy.clearTimeout).to.be.calledWith('clear:cookies')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('when an invalid domain prop is supplied', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('error').message).to.eq('`cy.clearCookies()` must be passed a valid domain name. You passed: `true`')
          expect(lastLog.get('error').docsUrl).to.eq('https://on.cypress.io/clearcookies')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookies({ domain: true })
      })

      it('logs once on \'get:cookies\' error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'some err message\n  at fn (foo.js:1:1)'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves([{ name: 'foo' }])
        Cypress.automation.withArgs('clear:cookies').resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.clearCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/clearcookies')

          done()
        })

        cy.clearCookies({ timeout: 50 })
      })

      it('logs once on \'clear:cookies\' error', function (done) {
        Cypress.automation.withArgs('get:cookies').resolves([
          { name: 'foo' }, { name: 'bar' },
        ])

        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.withArgs('clear:cookies').rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearCookies()
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo', domain: 'localhost' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([
          { name: 'foo' },
        ])
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('clearCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.clearCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.deep.eq([{ name: 'foo' }])
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })

    describe('.log with no cookies returned', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })

    describe('.log when no cookies were cleared', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', { domain: 'localhost' })
        .resolves([{ name: 'foo', domain: 'localhost' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })
  })

  context('#clearAllCookies', () => {
    it('returns null', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearAllCookies().should('be.null')
    })

    it('does not call \'clear:cookies\' when no cookies were returned', () => {
      Cypress.automation.withArgs('get:cookies').resolves([])

      cy.clearAllCookies().then(() => {
        expect(Cypress.automation).not.to.be.calledWith(
          'clear:cookies',
        )
      })
    })

    it('calls \'clear:cookies\' with all cookies', () => {
      Cypress.automation
      .withArgs('get:cookies')
      .resolves([
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'bar.com' },
        { name: 'qux', domain: 'qux.com' },
      ])
      .withArgs('clear:cookies', [
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'bar.com' },
        { name: 'qux', domain: 'qux.com' },
      ])
      .resolves([
        { name: 'foo', domain: 'localhost' },
        { name: 'bar', domain: 'bar.com' },
        { name: 'qux', domain: 'qux.com' },
      ])

      cy
      .clearAllCookies().should('be.null').then(() => {
        expect(Cypress.automation).to.be.calledWith(
          'clear:cookies', [
            { name: 'foo', domain: 'localhost' },
            { name: 'bar', domain: 'bar.com' },
            { name: 'qux', domain: 'qux.com' },
          ],
        )
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        Cypress.automation
        .withArgs('get:cookies')
        .resolves([{}])
        .withArgs('clear:cookies')
        .resolves({})
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearAllCookies().then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        Cypress.automation.resolves([])

        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.clearAllCookies({ timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.clearAllCookies().then(() => {
          expect(cy.clearTimeout).to.be.calledWith('get:cookies')
          expect(cy.clearTimeout).to.be.calledWith('clear:cookies')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('errors', { defaultCommandTimeout: 100 }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('logs once on \'get:cookies\' error', function (done) {
        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'some err message\n  at fn (foo.js:1:1)'

        Cypress.automation.rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearAllCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearAllCookies()
      })

      it('throws after timing out', function (done) {
        Cypress.automation.resolves([{ name: 'foo' }])
        Cypress.automation.withArgs('clear:cookies').resolves(Promise.delay(1000))

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('name')).to.eq('clearAllCookies')
          expect(lastLog.get('message')).to.eq('')
          expect(err.message).to.eq('`cy.clearAllCookies()` timed out waiting `50ms` to complete.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/clearallcookies')

          done()
        })

        cy.clearAllCookies({ timeout: 50 })
      })

      it('logs once on \'clear:cookies\' error', function (done) {
        Cypress.automation.withArgs('get:cookies').resolves([
          { name: 'foo' }, { name: 'bar' },
        ])

        const error = new Error('some err message')

        error.name = 'foo'
        error.stack = 'stack'

        Cypress.automation.withArgs('clear:cookies').rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error').message).to.contain(`\`cy.clearAllCookies()\` had an unexpected error clearing cookies in ${Cypress.browser.displayName}.`)
          expect(lastLog.get('error').message).to.contain('some err message')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.clearAllCookies()
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', {})
        .resolves([{ name: 'foo', domain: 'localhost' }])
        .withArgs('clear:cookies', [{ name: 'foo', domain: 'localhost' }])
        .resolves([
          { name: 'foo' },
        ])
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearAllCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.hiddenLog = log
          }
        })

        cy.clearAllCookies({ log: false }).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.ok
          expect(hiddenLog.get('name'), 'log name').to.eq('clearAllCookies')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('ends immediately', () => {
        cy.clearAllCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('ended')).to.be.true
          expect(lastLog.get('state')).to.eq('passed')
        })
      })

      it('snapshots immediately', () => {
        cy.clearAllCookies().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.clearAllCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.deep.eq([{ name: 'foo' }])
          expect(c.props['Num Cookies']).to.eq(1)
        })
      })
    })

    describe('.log with no cookies returned', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies')
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearAllCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })

    describe('.log when no cookies were cleared', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'clearAllCookies') {
            this.lastLog = log
          }
        })

        Cypress.automation
        .withArgs('get:cookies', {})
        .resolves([])
      })

      it('#consoleProps', () => {
        cy.clearAllCookies().then(function (cookies) {
          expect(cookies).to.be.null
          const c = this.lastLog.invoke('consoleProps')

          expect(c.props['Yielded']).to.eq('null')
          expect(c.props['Cleared Cookies']).to.be.undefined
          expect(c.props['Note']).to.eq('No cookies were found or removed.')
        })
      })
    })
  })
})
