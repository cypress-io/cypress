describe('cy.origin', { browser: '!webkit' }, () => {
  describe('successes', () => {
    it('succeeds on a localhost domain name', () => {
      cy.visit('')
      cy.origin('localhost', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://localhost/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://localhost') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on an ip address', () => {
      cy.visit('')
      cy.origin('127.0.0.1', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://127.0.0.1/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://127.0.0.1') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    // TODO: $Location does not support ipv6
    // https://github.com/cypress-io/cypress/issues/20970
    it.skip('succeeds on an ipv6 address', () => {
      cy.visit('')
      cy.origin('0000:0000:0000:0000:0000:0000:0000:0001', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://[::1]/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://[::1]') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a unicode domain', () => {
      cy.visit('')
      cy.origin('はじめよう.みんな', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://xn--p8j9a0d9c9a.xn--q9jyb4c/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://xn--p8j9a0d9c9a.xn--q9jyb4c') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin', () => {
      cy.visit('')
      cy.origin('http://foobar1.com:3500', () => undefined)
      cy.then(() => {
        const expectedSrc = `http://foobar1.com:3500/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://foobar1.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin using https', () => {
      cy.visit('')
      cy.origin('https://www.foobar2.com:3500', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://www.foobar2.com:3500/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://www.foobar2.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin from https using https', () => {
      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.origin('https://idp.com:3502', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://idp.com:3502/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://idp.com:3502') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds if url is the super domain as top but the super domain is excepted and must be strictly same origin', () => {
      cy.visit('https://www.google.com')
      cy.origin('accounts.google.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://accounts.google.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://accounts.google.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a hostname and port', () => {
      cy.visit('')
      cy.origin('foobar3.com:3500', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar3.com:3500/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar3.com:3500') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a protocol and hostname', () => {
      cy.visit('')
      cy.origin('http://foobar4.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `http://foobar4.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://foobar4.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a subdomain', () => {
      cy.visit('')
      cy.origin('app.foobar5.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://app.foobar5.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://app.foobar5.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds when only domain is passed', () => {
      cy.visit('')
      cy.origin('foobar6.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar6.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar6.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a url with path', () => {
      cy.visit('')
      cy.origin('http://www.foobar7.com/login', () => undefined)
      cy.then(() => {
        const expectedSrc = `http://www.foobar7.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://www.foobar7.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a url with a hash', () => {
      cy.visit('')
      cy.origin('http://www.foobar8.com/#hash', () => undefined)
      cy.then(() => {
        const expectedSrc = `http://www.foobar8.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://www.foobar8.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a url with a path and hash', () => {
      cy.visit('')
      cy.origin('http://www.foobar9.com/login/#hash', () => undefined)
      cy.then(() => {
        const expectedSrc = `http://www.foobar9.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ http://www.foobar9.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a domain with path', () => {
      cy.visit('')
      cy.origin('foobar10.com/login', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar10.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar10.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a domain with a hash', () => {
      cy.visit('')
      cy.origin('foobar11.com/#hash', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar11.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar11.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a domain with a path and hash', () => {
      cy.visit('')
      cy.origin('foobar12.com/login/#hash', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar12.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://foobar12.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a public suffix with a subdomain', () => {
      cy.visit('')
      cy.origin('app.foobar.herokuapp.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://app.foobar.herokuapp.com/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://app.foobar.herokuapp.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a machine name', () => {
      cy.visit('')
      cy.origin('machine-name', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://machine-name/__cypress/spec-bridge-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ https://machine-name') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('finds the right spec bridge with a subdomain', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.window().then((win) => {
        win.location.href = 'http://baz.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.origin('http://baz.foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('TJohnson')
        cy.get('[data-cy="login"]').click()
      })

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome TJohnson')
    })

    it('finds the correct spec bridge even if a previous spec bridge host is a subset of the current host', () => {
      cy.visit('')
      // Establish a spec bridge with a 'bar.com' host prior to loading 'foobar.com'
      cy.origin('http://www.bar.com:3500', () => undefined)

      cy.origin('http://www.app.foobar.com:3500', () => {
        cy.visit('/fixtures/primary-origin.html')
      })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23451
    it.skip('uses cy.origin twice', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.get('[data-cy="login-idp"]').click()
      cy.origin('http://www.idp.com:3500', () => {
        cy.get('[data-cy="username"]').type('BJohnson')
        cy.get('[data-cy="login"]').click()
      })

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome BJohnson')

      cy.get('[data-cy="logout"]').click()

      cy.window().then((win) => {
        win.location.href = 'http://baz.foobar.com:3500/fixtures/auth/idp.html'
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('[data-cy="username"]').type('TJohnson')
        cy.get('[data-cy="login"]').click()
      })

      cy.get('[data-cy="welcome"]')
      .invoke('text')
      .should('equal', 'Welcome TJohnson')
    })

    it('creates a spec bridge for https://idp.com:3502', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.origin('www.idp.com:3502', () => {
        cy.visit('https://www.idp.com:3502/fixtures/auth/index.html')
        cy.get('[data-cy="login-idp"]').invoke('text').should('equal', 'Login IDP')
      })
    })

    it('creates a spec bridge for http://www.idp.com:3500', () => {
      cy.visit('/fixtures/auth/index.html')
      cy.origin('http://www.idp.com:3500', () => {
        cy.visit('http://www.idp.com:3500/fixtures/auth/index.html')
        cy.get('[data-cy="login-idp"]').invoke('text').should('equal', 'Login IDP')
      })
    })
  })

  describe('errors', () => {
    // @ts-ignore
    it('errors if experimental flag is not enabled', { experimentalSessionAndOrigin: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires enabling the experimentalSessionAndOrigin flag')

        done()
      })

      cy.visit('')

      // @ts-ignore
      cy.origin()
    })

    it('errors if passed a non-string for the origin argument', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either a url (`https://www.example.com/path`) or a domain name (`example.com`). Query parameters are not allowed. You passed: ``')

        done()
      })

      cy.visit('')

      // @ts-ignore
      cy.origin()
    })

    it('errors if query params are provided', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the first argument to be either a url (`https://www.example.com/path`) or a domain name (`example.com`). Query parameters are not allowed. You passed: `http://www.foobar.com?foo=bar`')

        done()
      })

      cy.visit('')

      cy.origin('http://www.foobar.com?foo=bar', () => undefined)
    })

    it('errors if the url param is same superDomainOrigin as top', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.origin()` requires the first argument to be either a url or a domain name that is cross origin when compared to the top url. You passed `http://localhost:3500` to the origin command, while top is at `http://localhost:3500`')

        done()
      })

      cy.visit('')

      cy.origin(window.origin, () => undefined)
    })

    it('errors if the url param is same origin as top', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.origin()` requires the first argument to be either a url or a domain name that is cross origin when compared to the top url. You passed `https://www.google.com` to the origin command, while top is at `https://www.google.com`')

        done()
      })

      cy.visit('https://www.google.com')
      cy.origin('https://www.google.com', () => undefined)
    })

    it('errors passing non-array to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the \'options\' argument to be an object. You passed: `foo`')

        done()
      })

      cy.visit('')

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

      cy.visit('')

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

      cy.visit('')

      const el = document.createElement('div')

      cy.origin('foobar.com', { args: ['foo', '1', el] }, () => {})
    })

    it('errors if last argument is absent', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the last argument to be a function. You passed: ``')

        done()
      })

      cy.visit('')

      // @ts-ignore
      cy.origin('foobar.com')
    })

    it('errors if last argument is not a function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.origin()` requires the last argument to be a function. You passed: `{}`')

        done()
      })

      cy.visit('')

      // @ts-ignore
      cy.origin('foobar.com', {})
    })

    it('errors and does not hang when throwing a mixed content error creating the spec bridge', { defaultCommandTimeout: 50 }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include(`\`cy.origin()\` failed to create a spec bridge to communicate with the specified origin. This can happen when you attempt to create a spec bridge to an insecure (http) frame from a secure (https) frame.`)

        done()
      })

      cy.visit('https://foobar.com:3502/fixtures/primary-origin.html')
      cy.origin('http://foobar.com:3500', () => {})
    })
  })
})
