import { stripIndent } from 'common-tags'

import { assertLogLength } from '../../../support/utils'

const { Promise } = Cypress

describe('src/cy/commands/navigation', () => {
  context('#visit', () => {
    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'visit') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('sets error command state', function (done) {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(new Error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/fixtures/generic.html')
      })

      it('logs once on error', function (done) {
        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(new Error)

        cy.on('fail', (err) => {
          assertLogLength(this.logs, 1)

          done()
        })

        cy.visit('/fixtures/generic.html')
      })

      it('logs once on timeout error', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(err.message).to.include('Your page did not fire its `load` event within `20ms`.')
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/timeout?ms=5000', { timeout: 20 })
      })

      it('cancels resolve url promise on timeout', (done) => {
        cy.on('collect:run:state', () => {
          done(new Error('should not have tried to swap domains'))
        })

        const fn = () => {
          // resolve after 100ms
          return Promise.delay(100)
          .then(() => {
            done(new Error('should not have invoked this callback'))
          })
        }

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .callsFake(fn)

        cy.on('fail', () => {
          done()
        })

        cy.visit('/', { timeout: 20 })
      })

      it('throws when url isnt a string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.visit()` must be called with a `url` or an `options` object containing a `url` as its 1st argument')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        // @ts-expect-error - missing url
        cy.visit()
      })

      it('throws when url is specified twice', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` must be called with only one `url`. You specified two urls')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit('http://foobarbaz', {
          url: 'http://foobarbaz',
        })
      })

      it('throws when method is unsupported', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` was called with an invalid method: `FOO`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        // @ts-expect-error - invalid method
        cy.visit({
          url: 'http://foobarbaz',
          method: 'FOO',
        })
      })

      it('throws when headers is not an object', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.visit()` requires the `headers` option to be an object')
          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        // @ts-expect-error - invalid headers
        cy.visit({
          url: 'http://foobarbaz',
          headers: 'quux',
        })
      });

      [
        'foo',
        null,
        false,
      ].forEach((qs) => {
        const str = String(qs)

        it(`throws when qs is ${str}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.contain(`\`cy.visit()\` requires the \`qs\` option to be an object, but received: \`${str}\``)

            done()
          })

          // @ts-expect-error - invalid qs
          cy.visit({
            url: 'http://foobarbaz',
            qs,
          })
        })
      })

      it('throws when failOnStatusCode is false and retryOnStatusCodeFailure is true', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(stripIndent`\
            \`cy.visit()\` was called with options that cannot be used together:

              { failOnStatusCode: false, retryOnStatusCodeFailure: true }

            \`retryOnStatusCodeFailure\` retries a page that responds with a status code other than \`2xx\` or \`3xx\`, and fails if the last retry gets one too. It requires \`failOnStatusCode: true\`.

            Pass one of these combinations instead:

              1. To retry on these status codes, pass \`{ failOnStatusCode: true, retryOnStatusCodeFailure: true }\`.
              2. To fail on these status codes without retrying, which is the default, pass \`{ failOnStatusCode: true, retryOnStatusCodeFailure: false }\`.
              3. To not fail on these status codes, pass \`{ failOnStatusCode: false, retryOnStatusCodeFailure: false }\`.`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })

        cy.visit({
          url: 'http://foobarbaz',
          failOnStatusCode: false,
          retryOnStatusCodeFailure: true,
        })
      })

      it('shows the values passed for failOnStatusCode and retryOnStatusCodeFailure', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('{ failOnStatusCode: 0, retryOnStatusCodeFailure: 1 }')

          done()
        })

        // @ts-expect-error - checking that non-boolean values are echoed back as passed
        cy.visit({
          url: 'http://foobarbaz',
          failOnStatusCode: 0,
          retryOnStatusCodeFailure: 1,
        })
      })

      it('displays loading_network_failed when _resolveUrl throws', function (done) {
        const err1: Error & { url?: string } = new Error('connect ECONNREFUSED 127.0.0.1:64646')

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .rejects(err1)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            http://localhost:3500/foo.html

            We attempted to make an http request to this URL but the request failed without a response.

            We received this error at the network level:

              > Error: connect ECONNREFUSED 127.0.0.1:64646

            Common situations why this would fail:
              - you don't have internet access
              - you forgot to run / boot your web server
              - your web server isn't accessible
              - you have weird network configuration settings on your computer`)

          expect(err1.url).to.include('/foo.html')
          expect(emit).to.be.calledWith('visit:failed', err1)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/foo.html')
      })

      it('displays loading_file_failed when _resolveUrl resp is not ok', function (done) {
        const obj: Record<string, unknown> = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: '/foo.html',
          filePath: '/path/to/foo.html',
          status: 404,
          statusText: 'Not Found',
          redirects: [],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            /foo.html

            We failed looking for this file at the path:

            /path/to/foo.html

            The internal Cypress web server responded with:

              > 404: Not Found`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/foo.html')
      })

      it('displays loading_file_failed redirects when _resolveUrl resp is not ok', function (done) {
        const obj: Record<string, unknown> = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: '/bar',
          filePath: '/path/to/bar/',
          status: 404,
          statusText: 'Not Found',
          redirects: [
            '301: http://localhost:3500/bar/',
          ],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            /bar

            We failed looking for this file at the path:

            /path/to/bar/

            The internal Cypress web server responded with:

              > 404: Not Found

            We were redirected '1' time to:

              - 301: http://localhost:3500/bar/`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('/bar')
      })

      it('displays loading_http_failed when _resolveUrl resp is not ok', function (done) {
        const obj: Record<string, unknown> = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: 'https://google.com/foo',
          status: 500,
          statusText: 'Server Error',
          redirects: [],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not \`2xx\`.

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\``)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      it('displays loading_http_failed redirects when _resolveUrl resp is not ok', function (done) {
        const obj: Record<string, unknown> = {
          isOkStatusCode: false,
          isHtml: true,
          contentType: 'text/html',
          originalUrl: 'https://google.com/foo',
          status: 401,
          statusText: 'Unauthorized',
          redirects: [
            '302: https://google.com/bar/',
            '301: https://gmail.com/',
          ],
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 401: Unauthorized

            This was considered a failure because the status code was not \`2xx\`.

            This http request was redirected '2' times to:

              - 302: https://google.com/bar/
              - 301: https://gmail.com/

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\``)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      // https://github.com/cypress-io/cypress/issues/8506
      it('accepts text/html; + parameter as content-type', () => {
        cy.visit('http://localhost:3500/html-content-type-with-charset-param')
      });

      // https://github.com/cypress-io/cypress/issues/3101
      [{
        contentType: 'application/json',
        pathName: 'json-content-type',
      }, {
        contentType: 'text/image',
        pathName: 'invalid-content-type',
      }]
      .forEach(({ contentType, pathName }) => {
        it(`displays loading_invalid_content_type when content type is ${contentType} on http requests`, function (done) {
          cy.on('fail', (err) => {
            const { lastLog } = this

            expect(err.message).to.include(stripIndent`\
              \`cy.visit()\` failed trying to load:

              http://localhost:3500/${pathName}

              The \`content-type\` of the response we received from your web server was:

                > \`${contentType}\`

              This was considered a failure because responses must have \`content-type: 'text/html'\`

              However, you can likely use \`cy.request()\` instead of \`cy.visit()\`.

              \`cy.request()\` will automatically get and set cookies and enable you to parse responses.`)

            assertLogLength(this.logs, 1)
            expect(lastLog.get('error')).to.eq(err)

            done()
          })

          cy.visit(`http://localhost:3500/${pathName}`)
        })
      })

      it('displays loading_invalid_content_type when isHtml is false on file requests', function (done) {
        const obj: Record<string, unknown> = {
          isOkStatusCode: true,
          isHtml: false,
          filePath: '/path/to/bar/',
          contentType: 'application/json',
          originalUrl: 'https://google.com/foo',
          status: 200,
          statusText: 'OK',
        }

        obj.url = obj.originalUrl

        cy.stub(Cypress, 'backend').log(false)
        .withArgs('resolve:url', 'https://google.com/foo')
        .resolves(obj)

        // dont log else we create an endless loop!
        const emit = cy.spy(Cypress, 'emit').log(false)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(stripIndent`\
            \`cy.visit()\` failed trying to load:

            https://google.com/foo

            The \`content-type\` of the response we received from this local file was:

              > \`application/json\`

            This was considered a failure because responses must have \`content-type: 'text/html'\`

            However, you can likely use \`cy.request()\` instead of \`cy.visit()\`.

            \`cy.request()\` will automatically get and set cookies and enable you to parse responses.`)

          expect(emit).to.be.calledWithMatch('visit:failed', obj)
          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.visit('https://google.com/foo')
      })

      it('displays body_circular when body is circular', function (done) {
        const foo: { bar: { baz: { quux?: unknown } } } = {
          bar: {
            baz: {},
          },
        }

        foo.bar.baz.quux = foo

        cy.visit({
          method: 'POST',
          url: 'http://foo.invalid/',
          body: foo,
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq(stripIndent`\
            The \`body\` parameter supplied to \`cy.visit()\` contained a circular reference at the path "bar.baz.quux".

            \`body\` can only be a string or an object with no circular references.`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/visit')

          done()
        })
      })
    })
  })
})
