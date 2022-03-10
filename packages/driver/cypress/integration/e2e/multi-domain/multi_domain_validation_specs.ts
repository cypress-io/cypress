// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true }, () => {
  describe('successes', () => {
    it('succeeds on a localhost domain name', () => {
      cy.switchToDomain('localhost', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://localhost/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ localhost') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on an ip address', () => {
      cy.switchToDomain('127.0.0.1', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://127.0.0.1/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ 127.0.0.1') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    // TODO: $Location does not support ipv6
    it.skip('succeeds on an ipv6 address', () => {
      cy.switchToDomain('0000:0000:0000:0000:0000:0000:0000:0001', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://[::1]/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ [::1]') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a unicode domain', () => {
      cy.switchToDomain('はじめよう.みんな', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://xn--p8j9a0d9c9a.xn--q9jyb4c/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ xn--p8j9a0d9c9a.xn--q9jyb4c') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin', () => {
      cy.switchToDomain('http://foobar1.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `http://foobar1.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ foobar1.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a complete origin using https', () => {
      cy.switchToDomain('https://foobar2.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar2.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ foobar2.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a hostname and port', () => {
      cy.switchToDomain('foobar3.com:3500', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar3.com:3500/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ foobar3.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a protocol and hostname', () => {
      cy.switchToDomain('http://foobar4.com', () => {})
      cy.then(() => {
        const expectedSrc = `http://foobar4.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ foobar4.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a subdomain', () => {
      cy.switchToDomain('app.foobar5.com', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar5.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ app.foobar5.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds when only domain is passed', () => {
      cy.switchToDomain('foobar6.com', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://foobar6.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ foobar6.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a public suffix with a subdomain', () => {
      cy.switchToDomain('app.foobar.herokuapp.com', () => {})
      cy.then(() => {
        const expectedSrc = `https://foobar.herokuapp.com/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ app.foobar.herokuapp.com') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })

    it('succeeds on a machine name', () => {
      cy.switchToDomain('machine-name', () => undefined)
      cy.then(() => {
        const expectedSrc = `https://machine-name/__cypress/multi-domain-iframes`
        const iframe = window.top?.document.getElementById('Spec\ Bridge:\ machine-name') as HTMLIFrameElement

        expect(iframe.src).to.equal(expectedSrc)
      })
    })
  })

  describe('errors', () => {
    // @ts-ignore
    it('errors if experimental flag is not enabled', { experimentalMultiDomain: false }, (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires enabling the experimentalMultiDomain flag')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if passed a non-string for the domain argument', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if query params are provided', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com?foo=bar`')

        done()
      })

      cy.switchToDomain('foobar.com?foo=bar', () => undefined)
    })

    it('errors if passed a domain name with a path', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com/login`')

        done()
      })

      cy.switchToDomain('foobar.com/login', () => undefined)
    })

    it('errors if passed a domain name with a hash', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either an origin (\'https://app.example.com\') or a domain name (\'example.com\'). The origin or domain name must not contain a path, hash, or query parameters. You passed: `foobar.com/#hash`')

        done()
      })

      cy.switchToDomain('foobar.com/#hash', () => undefined)
    })

    it('errors passing non-array to callback function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the \'data\' argument to be an array. You passed: `foo`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', 'foo', () => {})
    })

    it('errors if passed a non-serializable data value', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('data argument specified is not serializable')

        if (Cypress.browser.family === 'chromium') {
          expect(err.message).to.include('HTMLDivElement object could not be cloned')
        } else if (Cypress.browser.family === 'firefox') {
          expect(err.message).to.include('The object could not be cloned')
        }

        done()
      })

      const el = document.createElement('div')

      cy.switchToDomain('foobar.com', ['foo', '1', el], () => {})
    })

    it('errors if last argument is absent', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com')
    })

    it('errors if last argument is not a function', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the last argument to be a function. You passed: `{}`')

        done()
      })

      // @ts-ignore
      cy.switchToDomain('foobar.com', {})
    })
  })
})
