// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain', { experimentalSessionSupport: true }, () => {
  describe('successes', () => {
    it('succeeds on a localhost domain name', () => {
      cy.switchToDomain('localhost', () => undefined)
    })

    it('succeeds on an ip address', () => {
      cy.switchToDomain('127.0.0.1', () => undefined)
    })

    // TODO: an ipv6 address passes validation but hangs elsewhere in the code, Come back later and fix ipv6
    it.skip('succeeds on an ipv6 address', () => {
      cy.switchToDomain('0000:0000:0000:0000:0000:0000:0000:0001', () => undefined)
    })

    it('succeeds on a unicode domain', () => {
      cy.switchToDomain('はじめよう.みんな', () => undefined)
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
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either \'localhost\', an ip address (\'127.0.0.1\') or a domain name (\'example.com\'). Domain names must not contain sub domains, ports or paths. You passed: ``')

        done()
      })

      // @ts-ignore
      cy.switchToDomain()
    })

    it('errors if passed a top level domain name', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either \'localhost\', an ip address (\'127.0.0.1\') or a domain name (\'example.com\'). Domain names must not contain sub domains, ports or paths. You passed: `foobar`')

        done()
      })

      cy.switchToDomain('foobar', () => undefined)
    })

    it('errors if passed a domain name with a sub domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either \'localhost\', an ip address (\'127.0.0.1\') or a domain name (\'example.com\'). Domain names must not contain sub domains, ports or paths. You passed: `eu.foobar.com`')

        done()
      })

      cy.switchToDomain('eu.foobar.com', () => undefined)
    })

    it('errors if passed a domain name with a port', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either \'localhost\', an ip address (\'127.0.0.1\') or a domain name (\'example.com\'). Domain names must not contain sub domains, ports or paths. You passed: `foobar.com:3000`')

        done()
      })

      cy.switchToDomain('foobar.com:3000', () => undefined)
    })

    it('errors if passed a domain name with a path', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`cy.switchToDomain()` requires the first argument to be either \'localhost\', an ip address (\'127.0.0.1\') or a domain name (\'example.com\'). Domain names must not contain sub domains, ports or paths. You passed: `foobar.com/login`')

        done()
      })

      cy.switchToDomain('foobar.com/login', () => undefined)
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
