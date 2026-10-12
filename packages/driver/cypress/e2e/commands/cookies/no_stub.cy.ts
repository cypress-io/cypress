const isWebkit = Cypress.isBrowser('webkit')

export {}

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

  it('sets the cookie on the specified domain as hostOnly and validates hostOnly property persists through related commands that fetch cookies', () => {
    const isWebkit = Cypress.browser.name.includes('webkit')

    cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
    cy.setCookie('foo', 'bar', { hostOnly: true })

    cy.getCookie('foo').its('domain').should('eq', 'www.barbaz.com')
    if (!isWebkit) {
      cy.getCookie('foo').its('hostOnly').should('eq', true)
    }

    cy.getCookies().should((cookies) => {
      expect(cookies).to.have.lengthOf(1)

      const cookie = cookies[0]

      expect(cookie).to.have.property('domain', 'www.barbaz.com')
      if (!isWebkit) {
        expect(cookie).to.have.property('hostOnly', true)
      }
    })

    cy.getAllCookies().should((cookies) => {
      expect(cookies).to.have.lengthOf(1)

      const cookie = cookies[0]

      expect(cookie).to.have.property('domain', 'www.barbaz.com')
      if (!isWebkit) {
        expect(cookie).to.have.property('hostOnly', true)
      }
    })
  })

  context('#getCookies', () => {
    it('returns cookies from only the bare domain matching the AUT by default when AUT is an apex domain', () => {
      cy.visit('http://barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookies().should((cookies) => {
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

        cy.getCookies().should((cookies) => {
          expect(cookies).to.have.length(1)
          expect(cookies[0].name).to.equal('key2')
          expect(cookies[0].domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns cookies from the subdomain and bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()
      cy.getCookies().should((cookies) => {
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

        cy.getCookies().should((cookies) => {
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

      cy.getCookies({ domain: 'www.foobar.com' }).should((cookies) => {
        expect(cookies).to.have.length(2)

        const sortedCookies = Cypress._.sortBy(cookies, 'name')

        expect(sortedCookies[0].name).to.equal('key1')
        expect(sortedCookies[0].domain).to.match(/\.?www\.foobar\.com/)
        expect(sortedCookies[1].name).to.equal('key2')
        expect(sortedCookies[1].domain).to.match(/\.?foobar\.com/)
      })

      cy.getCookies({ domain: 'barbaz.com' }).should((cookies) => {
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

        cy.getCookies({ domain: 'www.barbaz.com' }).should((cookies) => {
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

      cy.getAllCookies().should((cookies) => {
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

        cy.getAllCookies().should((cookies) => {
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

      cy.getCookie('key').should((cookie) => {
        expect(cookie?.value).to.equal('barbaz.com value')
        expect(cookie?.domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://foobar.com:3500', () => {
        cy.visit('http://foobar.com:3500/fixtures/generic.html')

        cy.getCookie('key').should((cookie) => {
          expect(cookie?.value).to.equal('foobar.com value')
          expect(cookie?.domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('can return the cookie from the subdomain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'www.barbaz.com value', { domain: 'www.barbaz.com', log: false })

      cy.getCookie('key').should((cookie) => {
        expect(cookie?.value).to.equal('www.barbaz.com value')
        expect(cookie?.domain).to.match(/\.?www\.barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'www.foobar.com value', { domain: 'www.foobar.com', log: false })

        cy.getCookie('key').should((cookie) => {
          expect(cookie?.value).to.equal('www.foobar.com value')
          expect(cookie?.domain).to.match(/\.?www\.foobar\.com/)
        })
      })
    })

    it('can return the cookie from the bare domain matching the AUT by default when AUT is a subdomain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      cy.setCookie('key', 'barbaz.com value', { domain: 'barbaz.com', log: false })

      cy.getCookie('key').should((cookie) => {
        expect(cookie?.value).to.equal('barbaz.com value')
        expect(cookie?.domain).to.match(/\.?barbaz\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')
        cy.setCookie('key', 'foobar.com value', { domain: 'foobar.com', log: false })

        cy.getCookie('key').should((cookie) => {
          expect(cookie?.value).to.equal('foobar.com value')
          expect(cookie?.domain).to.match(/\.?foobar\.com/)
        })
      })
    })

    it('returns the cookie from the specified domain', () => {
      cy.visit('http://www.barbaz.com:3500/fixtures/generic.html')
      setCookies()

      cy.getCookie('key', { domain: 'www.foobar.com' }).should((cookie) => {
        expect(cookie?.value).to.equal('www.foobar.com value')
        expect(cookie?.domain).to.match(/\.?www\.foobar\.com/)
      })

      // webkit does not support cy.origin()
      if (isWebkit) return

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/fixtures/generic.html')

        cy.getCookie('key', { domain: 'www.barbaz.com' }).should((cookie) => {
          expect(cookie?.value).to.equal('www.barbaz.com value')
          expect(cookie?.domain).to.match(/\.?www\.barbaz\.com/)
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
})
