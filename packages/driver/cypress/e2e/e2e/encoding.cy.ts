/**
 * E2E tests for accept/content encoding (br, gzip, layered, invalid) through the proxy.
 * Each test requests the HTML page, which includes the script and stylesheet; we assert
 * all three (html body, js global, css) in one visit.
 */

const expectedText = (encodingType: string, assetType: string) => `encoding-${encodingType}-${assetType}`

function assertEncodingPage (encodingType: string) {
  cy.get('#encoding-test').should('contain.text', expectedText(encodingType, 'html'))
  cy.get('#encoding-js').should('have.text', expectedText(encodingType, 'js'))
  cy.get('#encoding-test').then(($el) => {
    expect(getComputedStyle($el[0]).fontSize).to.eq('42px')
  })
}

function waitAndAssertInterceptions (alias: string, contentEncoding: string) {
  cy.wait([`@${alias}`, `@${alias}`, `@${alias}`]).then((interceptions) => {
    interceptions.forEach((interception) => {
      expect(interception.response?.statusCode).to.eq(200)
      expect(interception.response?.headers?.['content-encoding']).to.eq(contentEncoding)
    })
  })
}

describe('encoding', () => {
  context('br', () => {
    it('not intercepted: decodes br for html, js, and css', () => {
      cy.visit('encoding/br/html')

      assertEncodingPage('br')
    })

    it('intercepted: decodes br for html, js, and css', () => {
      cy.intercept('*').as('br')
      cy.visit('encoding/br/html')

      waitAndAssertInterceptions('br', 'br')
      assertEncodingPage('br')
    })

    it('sets the accept-encoding header in the cy.visit options', () => {
      cy.visit('encoding/br/html', { headers: { 'Accept-Encoding': 'br' } })

      assertEncodingPage('br')
    })
  })

  context('gzip', () => {
    it('not intercepted: decodes gzip for html, js, and css', () => {
      cy.visit('encoding/gzip/html')

      assertEncodingPage('gzip')
    })

    it('intercepted: decodes gzip for html, js, and css', () => {
      cy.intercept('*').as('gzip')
      cy.visit('encoding/gzip/html')

      waitAndAssertInterceptions('gzip', 'gzip')
      assertEncodingPage('gzip')
    })

    it('sets the accept-encoding header in the cy.visit options', () => {
      cy.visit('encoding/gzip/html', { headers: { 'Accept-Encoding': 'gzip' } })

      assertEncodingPage('gzip')
    })
  })

  context('layered-gzip-br', () => {
    it('not intercepted: decodes gzip,br for html, js, and css', () => {
      cy.visit('encoding/layered-gzip-br/html')

      assertEncodingPage('layered-gzip-br')
    })

    it('intercepted: decodes gzip,br for html, js, and css', () => {
      cy.intercept('*').as('layeredGzipBr')
      cy.visit('encoding/layered-gzip-br/html')

      waitAndAssertInterceptions('layeredGzipBr', 'gzip, br')
      assertEncodingPage('layered-gzip-br')
    })

    it('sets the accept-encoding header in the cy.visit options', () => {
      cy.visit('encoding/layered-gzip-br/html', { headers: { 'Accept-Encoding': 'gzip, br' } })

      assertEncodingPage('layered-gzip-br')
    })
  })

  context('layered-br-gzip', () => {
    it('not intercepted: decodes br,gzip for html, js, and css', () => {
      cy.visit('encoding/layered-br-gzip/html')

      assertEncodingPage('layered-br-gzip')
    })

    it('intercepted: decodes br,gzip for html, js, and css', () => {
      cy.intercept('*').as('layeredBrGzip')
      cy.visit('encoding/layered-br-gzip/html')

      waitAndAssertInterceptions('layeredBrGzip', 'br, gzip')
      assertEncodingPage('layered-br-gzip')
    })

    it('sets the accept-encoding header in the cy.visit options', () => {
      cy.visit('encoding/layered-br-gzip/html', { headers: { 'Accept-Encoding': 'br, gzip' } })

      assertEncodingPage('layered-br-gzip')
    })
  })

  context('invalid-br', () => {
    it('valid html loads; invalid js and css fail to decode', () => {
      cy.visit('encoding/invalid-br/html')

      cy.get('#encoding-test').should('contain.text', expectedText('invalid-br', 'html'))
      cy.get('#encoding-js').should('have.text', '')
      cy.get('#encoding-test').then(($el) => {
        expect(getComputedStyle($el[0]).fontSize).not.to.eq('42px')
      })
    })
  })

  context('invalid-gzip', () => {
    it('valid html loads; invalid js and css fail to decode', () => {
      cy.visit('encoding/invalid-gzip/html')

      cy.get('#encoding-test').should('contain.text', expectedText('invalid-gzip', 'html'))
      cy.get('#encoding-js').should('have.text', '')
      cy.get('#encoding-test').then(($el) => {
        expect(getComputedStyle($el[0]).fontSize).not.to.eq('42px')
      })
    })
  })

  context('insecure host', () => {
    it('decodes gzip for html, js, and css', () => {
      // in firefox, the browser tries to decode the response as br, which is invalid,
      // so we need to catch the exception and ignore it
      if (Cypress.isBrowser({ family: 'firefox' })) {
        cy.on('uncaught:exception', (err) => {
          return !err.message.includes('illegal character U+FFFD')
        })
      }

      cy.intercept('http://www.foobar.com:3500/encoding/br/js').as('brJs')

      cy.visit('http://www.foobar.com:3500/encoding/gzip/html')

      assertEncodingPage('gzip')

      // Try to request brotli js, will should fail due to insecure host
      cy.window().then((win) => {
        const script = win.document.createElement('script')

        script.src = 'http://www.foobar.com:3500/encoding/br/js'
        win.document.body.appendChild(script)
      })

      // The request will be successful but since the content-encoding is br,
      // the browser will fail to decode
      cy.wait('@brJs').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
        expect(interception.response?.headers?.['content-encoding']).to.eq('br')
        expect(interception.request.headers['accept-encoding']).to.eq('gzip, deflate')
      })

      // Assert that the encoding-js element is still gzip since br failed to decode
      cy.get('#encoding-js').should('have.text', 'encoding-gzip-js')
    })

    it('fails when brotli is requested due to insecure host', (done) => {
      cy.visit(`http://www.foobar.com:3500/encoding/br/html`, { timeout: 500 })

      // in firefox, the browser displays the encoded response whereas in other browsers, it fails to load the page
      if (Cypress.isBrowser({ family: 'firefox' })) {
        cy.get('body').should('contain.text', '�������t�Ѓ�*��z').then(() => done())
      } else {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Timed out after waiting `500ms` for your remote page to load.')
          done()
        })
      }
    })

    it('fails even when brotli is explicitly requested in the accept-encoding header', (done) => {
      cy.visit(`http://www.foobar.com:3500/encoding/br/html`, { timeout: 500, headers: { 'Accept-Encoding': 'br' } })

      // in firefox, the browser displays the encoded response whereas in other browsers, it fails to load the page
      if (Cypress.isBrowser({ family: 'firefox' })) {
        cy.get('body').should('contain.text', '�������t�Ѓ�*��z').then(() => done())
      } else {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('Timed out after waiting `500ms` for your remote page to load.')
          done()
        })
      }
    })
  })
})
