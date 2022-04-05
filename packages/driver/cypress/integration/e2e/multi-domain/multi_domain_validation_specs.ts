// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true }, () => {
  describe('successes', () => {
    it('succeeds on a localhost domain name', () => {
      cy.origin('localhost', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://localhost/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://localhost') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on an ip address', () => {
      cy.origin('127.0.0.1', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://127.0.0.1/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://127.0.0.1') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    // TODO: $Location does not support ipv6
    it.skip('succeeds on an ipv6 address', () => {
      cy.origin('0000:0000:0000:0000:0000:0000:0000:0001', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://[::1]/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://[::1]') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a unicode domain', () => {
      cy.origin('はじめよう.みんな', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://xn--p8j9a0d9c9a.xn--q9jyb4c/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://xn--p8j9a0d9c9a.xn--q9jyb4c') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin', () => {
      cy.origin('http://foobar1.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `http://foobar1.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://foobar1.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin using https', () => {
      cy.origin('https://foobar2.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar2.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar2.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a hostname and port', () => {
      cy.origin('foobar3.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar3.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar3.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a protocol and hostname', () => {
      cy.origin('http://foobar4.com', () => {})
      cy.then(() => {
        const expectedSrc = `http://foobar4.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://foobar4.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a subdomain', () => {
      cy.origin('app.foobar5.com', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar5.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar5.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds when only domain is passed', () => {
      cy.origin('foobar6.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar6.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar6.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a public suffix with a subdomain', () => {
      cy.origin('app.foobar.herokuapp.com', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar.herokuapp.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar.herokuapp.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a machine name', () => {
      cy.origin('machine-name', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://machine-name/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://machine-name') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('finds the right spec bridge with a subdomain', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.window().then((win) => {
        win.location.href = 'http://baz.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('TJohnson')
        cy.get('[data-cy="login"]').click()
      })

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome TJohnson')
    })

    it('uses cy.origin twice', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.get('[data-cy="login-idp"]').click() // Takes you to idp.com
      cy.origin('http://idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      }) // Trailing edge wait, waiting to return to the primary domain

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')

      cy.get('[data-cy="logout"]').click()

      cy.window().then((win) => {
        win.location.href = 'http://baz.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('TJohnson')
        cy.get('[data-cy="login"]').click()
      }) // Trailing edge wait, waiting to return to the primary domain

      // Verify that the user has logged in on /siteA
      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome TJohnson')
    })

    it('creates a spec bridge for https://idp.com:3502', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.origin('idp.com:3502', () => {
        cy.visit('https://www.idp.com:3502/fixtures/auth/index.html')
        cy.get('[data-cy="login-idp"]').invoke('text').should('equal', 'Login IDP')
      })
    })

    it('creates a spec bridge for http://idp.com:3500', () => {
      cy.visit('/fixtures/auth/index.html') // Establishes Primary Domain
      cy.origin('http://idp.com:3500', () => {
        cy.visit('http://www.idp.com:3500/fixtures/auth/index.html')
        cy.get('[data-cy="login-idp"]').invoke('text').should('equal', 'Login IDP')
      })
    })
  })

  describe('errors', () => {
    // @ts-ignore
    it('errors if experimental flag is not enabled', { experimentalMultiDomain: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires enabling the experimentalMultiDomain flag')

        done()
      })

      // @ts-ignore
      cy.origin()
    })

    it('errors if passed a non-string for the domain argument', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.origin()
    })

    it('errors if query params are provided', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com?foo=bar`')

        done()
      })

      cy.origin('foobar.com?foo=bar', () => undefined)
    })

    it('errors if passed a domain name with a path', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com/login`')

        done()
      })

      cy.origin('foobar.com/login', () => undefined)
    })

    it('errors if passed a domain name with a hash', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com/#hash`')

        done()
      })

      cy.origin('foobar.com/#hash', () => undefined)
    })

    it('errors passing non-array to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the \'options\' argument to be an object. You passed: `foo`')

        done()
      })

      // @ts-ignore
      cy.origin('foobar.com', 'foo', () => {})
    })

    it('errors passing in invalid config object to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.origin()` detected extraneous keys in your options configuration.')
        expect(err.message).to.include('The extraneous keys detected were:')
        expect(err.message).to.include('> `foo, bar`')
        expect(err.message).to.include('Valid keys include the following:')
        expect(err.message).to.include('> `args`')

        done()
      })

      cy.origin('foobar.com', {
        // @ts-ignore
        foo: 'foo',
        bar: 'bar',
      }, () => {})
    })

    it('errors if passed a non-serializable args value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('arguments specified are not serializable')

        if (Cypress.browser.family === 'chromium') {
          expect(err.message).to.include('HTMLDivElement object could not be cloned')
        } else if (Cypress.browser.family === 'firefox') {
          expect(err.message).to.include('The object could not be cloned')
        }

        done()
      })

      const el = document.createElement('div')

      cy.origin('foobar.com', { args: ['foo', '1', el] }, () => {})
    })

    it('errors if last argument is absent', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the last argument to be a function. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.origin('foobar.com')
    })

    it('errors if last argument is not a function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the last argument to be a function. You passed: `{}`')

        done()
      })

      // @ts-ignore
      cy.origin('foobar.com', {})
    })
  })
})
