const { stripIndent } = require('common-tags')
const { assertLogLength } = require('../../support/utils')
const { _, Promise } = Cypress

const RESPONSE_TIMEOUT = 22222

describe('src/cy/commands/request', () => {
  context('#request', {
    responseTimeout: RESPONSE_TIMEOUT,
  }, () => {
    beforeEach(() => {
      cy.stub(Cypress, 'backend').log(false).callThrough()
    })

    describe('argument signature', () => {
      beforeEach(function () {
        const backend = Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: true, status: 200 })

        this.expectOptionsToBe = function (opts) {
          _.defaults(opts, {
            failOnStatusCode: true,
            retryOnNetworkFailure: true,
            retryOnStatusCodeFailure: false,
            encoding: 'utf8',
            gzip: true,
            followRedirect: true,
            timeout: RESPONSE_TIMEOUT,
            method: 'GET',
            retryIntervals: [0, 100, 200, 200],
          })

          const options = backend.firstCall.args[1]

          _.each(options, (value, key) => {
            expect(options[key]).to.deep.eq(opts[key], `failed on property: (${key})`)
          })

          _.each(opts, (value, key) => {
            expect(opts[key]).to.deep.eq(options[key], `failed on property: (${key})`)
          })
        }
      })

      it('accepts object with url', () => {
        cy.request({ url: 'http://localhost:8000/foo' }).then(function () {
          this.expectOptionsToBe({
            url: 'http://localhost:8000/foo',
          })
        })
      })

      it('accepts object with url, method, headers, body', () => {
        cy.request({
          url: 'http://github.com/users',
          method: 'POST',
          body: { name: 'brian' },
          headers: {
            'x-token': 'abc123',
          },
        })
        .then(function () {
          this.expectOptionsToBe({
            url: 'http://github.com/users',
            method: 'POST',
            json: true,
            body: { name: 'brian' },
            headers: {
              'x-token': 'abc123',
            },
          })
        })
      })

      it('accepts object with url + timeout', () => {
        cy.request({ url: 'http://localhost:8000/foo', timeout: 23456 }).then(function () {
          this.expectOptionsToBe({
            url: 'http://localhost:8000/foo',
            timeout: 23456,
          })
        })
      })

      it('accepts string url', () => {
        cy.request('http://localhost:8080/status').then(function () {
          this.expectOptionsToBe({
            url: 'http://localhost:8080/status',
          })
        })
      })

      it('accepts method + url', () => {
        cy.request('DELETE', 'http://localhost:1234/users/1').then(function () {
          this.expectOptionsToBe({
            url: 'http://localhost:1234/users/1',
            method: 'DELETE',
          })
        })
      })

      it('accepts method + url + body', () => {
        cy.request('POST', 'http://localhost:8080/users', { name: 'brian' }).then(function () {
          this.expectOptionsToBe({
            url: 'http://localhost:8080/users',
            method: 'POST',
            body: { name: 'brian' },
            json: true,
          })
        })
      })

      it('accepts url + body', () => {
        cy.request('http://www.github.com/projects/foo', { commits: true }).then(function () {
          this.expectOptionsToBe({
            url: 'http://www.github.com/projects/foo',
            body: { commits: true },
            json: true,
          })
        })
      })

      it('accepts url + string body', () => {
        cy.request('http://www.github.com/projects/foo', 'foo').then(function () {
          this.expectOptionsToBe({
            url: 'http://www.github.com/projects/foo',
            body: 'foo',
          })
        })
      })

      context('method normalization', () => {
        it('uppercases method', () => {
          cy.request('post', 'https://www.foo.com').then(function () {
            this.expectOptionsToBe({
              url: 'https://www.foo.com/',
              method: 'POST',
            })
          })
        })
      })

      context('url normalization', () => {
        it('uses absolute urls and adds trailing slash', {
          baseUrl: 'http://localhost:8080/app',
        }, () => {
          cy.request('https://www.foo.com').then(function () {
            this.expectOptionsToBe({
              url: 'https://www.foo.com/',
            })
          })
        })

        it('uses localhost urls', () => {
          cy.request('localhost:1234').then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/',
            })
          })
        })

        it('uses www urls', () => {
          cy.request('www.foo.com').then(function () {
            this.expectOptionsToBe({
              url: 'http://www.foo.com/',
            })
          })
        })

        it('prefixes with baseUrl when origin is empty', {
          baseUrl: 'http://localhost:8080/app',
        }, () => {
          cy.stub(cy, 'getRemoteLocation').withArgs('origin').returns('')

          cy.request('/foo/bar?cat=1').then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8080/app/foo/bar?cat=1',
            })
          })
        })

        it('prefixes with baseUrl over current origin', {
          baseUrl: 'http://localhost:8080/app',
        }, () => {
          cy.stub(cy, 'getRemoteLocation').withArgs('origin').returns('http://localhost:1234')

          cy.request('foobar?cat=1').then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8080/app/foobar?cat=1',
            })
          })
        })

        // https://github.com/cypress-io/cypress/issues/5274
        it('encode url with ’ character in pathname', () => {
          cy.request({ url: 'http://localhost:1234/’' }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%E2%80%99',
            })
          })
        })

        it('dont re-encode url with ’ escaped in pathname', () => {
          cy.request({ url: encodeURI('http://localhost:1234/’') }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%E2%80%99',
            })
          })
        })

        it('encode url with % character in pathname', () => {
          cy.request({ url: 'http://localhost:1234/%' }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%',
            })
          })
        })

        it('dont re-encode url with % escaped in pathname', () => {
          cy.request({ url: encodeURI('http://localhost:1234/%') }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%25',
            })
          })
        })

        it('encode url with Astral Plane Unicode in pathname', () => {
          cy.request({ url: 'http://localhost:1234/😀' }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%F0%9F%98%80',
            })
          })
        })

        it('dont re-encode url with Astral Plane Unicode escaped character in pathname', () => {
          cy.request({ url: encodeURI('http://localhost:1234/😀') }).then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:1234/%F0%9F%98%80',
            })
          })
        })

        it('should percent escape Unicode in pathname and convert Unicode in domain name properly', () => {
          cy.request({ url: 'http://localhost😀:1234/😀' }).then(function () {
            this.expectOptionsToBe({
              url: 'http://xn--localhost-ob26h:1234/%F0%9F%98%80',
            })
          })
        })

        it('should percent escape Unicode in pathname and convert Unicode in domain name with URI encoded URL', () => {
          cy.request({ url: encodeURI('http://localhost😀:1234/😀') }).then(function () {
            this.expectOptionsToBe({
              url: 'http://xn--localhost-ob26h:1234/%F0%9F%98%80',
            })
          })
        })
      })

      context('encoding', () => {
        it('lowercases encoding', () => {
          cy.request({
            url: 'http://localhost:8080/',
            encoding: 'UtF8',
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8080/',
              encoding: 'utf8',
            })
          })
        })

        it('defaults encoding to `utf8`', () => {
          cy.request({
            url: 'http://localhost:8080/',
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8080/',
              encoding: 'utf8',
            })
          })
        })
      })

      context('gzip', () => {
        it('can turn off gzipping', () => {
          cy.request({
            url: 'http://localhost:8080',
            gzip: false,
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8080/',
              gzip: false,
            })
          })
        })
      })

      context('auth', () => {
        it('sends auth when it is an object', () => {
          cy.request({
            url: 'http://localhost:8888',
            auth: {
              user: 'brian',
              pass: 'password',
            },
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              auth: {
                user: 'brian',
                pass: 'password',
              },
            })
          })
        })
      })

      context('followRedirect', () => {
        it('is true by default', () => {
          cy.request('http://localhost:8888')
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
            })
          })
        })

        it('can be set to false', () => {
          cy.request({
            url: 'http://localhost:8888',
            followRedirect: false,
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              followRedirect: false,
            })
          })
        })

        it('normalizes followRedirects -> followRedirect', () => {
          cy.request({
            url: 'http://localhost:8888',
            followRedirects: false,
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              followRedirect: false,
            })
          })
        })
      })

      context('qs', () => {
        it('accepts an object literal', () => {
          cy.request({
            url: 'http://localhost:8888',
            qs: {
              foo: 'bar',
            },
          })
          .then(function () {
            // qs is encoded and merged into the url to make url consistent with cy.visit() and URLSearchParams
            this.expectOptionsToBe({
              url: 'http://localhost:8888/?foo=bar',
            })
          })
        })
      })

      context('form', () => {
        it('accepts an object literal for body', () => {
          cy.request({
            url: 'http://localhost:8888',
            form: true,
            body: {
              foo: 'bar',
            },
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              form: true,
              body: { foo: 'bar' },
            })
          })
        })

        it('accepts a string for body', () => {
          cy.request({
            url: 'http://localhost:8888',
            form: true,
            body: 'foo=bar&baz=quux',
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              form: true,
              body: 'foo=bar&baz=quux',
            })
          })
        })

        // https://github.com/cypress-io/cypress/issues/2923
        it('application/x-www-form-urlencoded w/ an object body uses form: true', () => {
          cy.request({
            url: 'http://localhost:8888',
            headers: {
              'a': 'b',
              'Content-type': 'application/x-www-form-urlencoded',
            },
            body: { foo: 'bar' },
          })
          .then(function () {
            this.expectOptionsToBe({
              url: 'http://localhost:8888/',
              form: true,
              headers: {
                'a': 'b',
                'Content-type': 'application/x-www-form-urlencoded',
              },
              body: { foo: 'bar' },
            })
          })
        })
      })
    })

    describe('querystring', () => {
      // https://github.com/cypress-io/cypress/issues/19407
      it('generated querystring should be consistent with cy.visit() and URLSearchParams', () => {
        const url = '/status-code'
        const qs = {
          postId: [1, 2],
          id: 3,
        }

        let visitURL
        let requestURL

        cy.intercept(`${url}*`, {
          statusCode: 200,
          headers: {
            'content-type': 'text/html',
          },
        }).as('request')

        cy.visit({
          url,
          qs,
        })

        cy.wait('@request').then(({ request }) => {
          visitURL = request.url
        }).then(() => {
          cy.request({
            url,
            qs,
          }).then((resp) => {
            requestURL = resp.allRequestResponses[0]['Request URL']
          })
        }).then(() => {
          expect(requestURL).to.eq(visitURL)

          // Check if the querystring matches the querystring generated by the default URLSearchParams.
          const params = new URLSearchParams({
            postId: [1, 2],
            id: 3,
          })

          expect(requestURL).to.eq(`http://localhost:3500${url}?${params.toString()}`)
        })
      })
    })

    describe('failOnStatusCode', () => {
      it('does not fail on status 401', () => {
        Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: false, status: 401 })

        cy.request({
          url: 'http://localhost:1234/foo',
          failOnStatusCode: false,
        })
        .then((resp) => {
          // make sure it really was 500!
          expect(resp.status).to.eq(401)
        })
      })
    })

    describe('method', () => {
      it('can use M-SEARCH method', () => {
        cy.request({
          url: 'http://localhost:3500/dump-method',
          method: 'm-Search',
        })
        .then((res) => {
          expect(res.body).to.contain('M-SEARCH')
        })
      })
    })

    describe('headers', () => {
      it('can send user-agent header', () => {
        cy.request({
          url: 'http://localhost:3500/dump-headers',
          headers: {
            'user-agent': 'something special',
          },
        })
        .then((res) => {
          expect(res.body).to.contain('"user-agent":"something special"')
        })
      })
    })

    describe('binary data', () => {
      // https://github.com/cypress-io/cypress/issues/6178
      it('can send Blob', () => {
        const body = new Blob([[1, 2, 3, 4]], { type: 'application/octet-stream' })

        cy.request(
          {
            body,
            method: 'POST',
            url: 'http://localhost:3500/dump-octet-body',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          },
        )
        .then((response) => {
          expect(response.status).to.equal(200)

          // When user-passed body to the Nodejs server is a Buffer,
          // Nodejs doesn't provide any decoder in the response.
          // So, we need to decode it ourselves.
          const dec = new TextDecoder()

          expect(dec.decode(response.body)).to.contain('1,2,3,4')
        })
      })

      it('can send FormData with File', () => {
        const formData = new FormData()

        formData.set('file', new File(['1,2,3,4'], 'upload.txt'), 'upload.txt')
        formData.set('name', 'Tony Stark')
        cy.request({
          method: 'POST',
          url: 'http://localhost:3500/dump-form-data',
          body: formData,
          headers: {
            'content-type': 'multipart/form-data',
          },
        })
        .then((response) => {
          expect(response.status).to.equal(200)
          // When user-passed body to the Nodejs server is a Buffer,
          // Nodejs doesn't provide any decoder in the response.
          // So, we need to decode it ourselves.
          const dec = new TextDecoder()
          const result = dec.decode(response.body)

          expect(result).to.contain('Tony Stark')
          expect(result).to.contain('upload.txt')
        })
      })
    })

    describe('subjects', () => {
      it('resolves with response obj', () => {
        const resp = {
          status: 200,
          isOkStatusCode: true,
          body: '<html>foo</html>',
          headers: { foo: 'bar' },
        }

        Cypress.backend
        .withArgs('http:request')
        .resolves(resp)

        cy.request('http://www.foo.com').then((subject) => {
          expect(subject).to.deep.eq(resp)
        })
      })
    })

    describe('timeout', () => {
      beforeEach(() => {
        Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: true, status: 200 })
      })

      it('sets timeout to Cypress.config(responseTimeout)', {
        responseTimeout: 2500,
      }, () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.request('http://www.foo.com').then(() => {
          expect(timeout).to.be.calledWith(2500)
        })
      })

      it('can override timeout', () => {
        const timeout = cy.spy(Promise.prototype, 'timeout')

        cy.request({ url: 'http://www.foo.com', timeout: 1000 }).then(() => {
          expect(timeout).to.be.calledWith(1000)
        })
      })

      it('clears the current timeout and restores after success', () => {
        cy.timeout(100)

        cy.spy(cy, 'clearTimeout')

        cy.request('http://www.foo.com').then(() => {
          expect(cy.clearTimeout).to.be.calledWith('http:request')

          // restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'request') {
            this.lastLog = log
          }
        })

        return null
      })

      it('can turn off logging', () => {
        Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: true, status: 200 })

        cy.request({
          url: 'http://localhost:8080',
          log: false,
        })
        .then(function () {
          expect(this.lastLog).to.be.undefined
        })
      })

      it('logs immediately before resolving', (done) => {
        Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: true, status: 200 })

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'request') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('')

            done()
          }
        })

        cy.request('http://localhost:8080')
      })

      it('snapshots after clicking', () => {
        Cypress.backend
        .withArgs('http:request')
        .resolves({ isOkStatusCode: true, status: 200 })

        cy.request('http://localhost:8080').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('.consoleProps', () => {
        const allRequestResponse = {
          'Request URL': 'http://localhost:8080/foo',
          'Request Headers': { 'x-token': 'ab123' },
          'Request Body': { first: 'brian' },
          'Response Headers': {
            'Content-Type': 'application/json',
          },
          'Response Body': { id: 123 },
        }

        Cypress.backend
        .withArgs('http:request')
        .resolves({
          duration: 10,
          status: 201,
          isOkStatusCode: true,
          body: { id: 123 },
          headers: {
            'Content-Type': 'application/json',
          },
          requestHeaders: { 'x-token': 'ab123' },
          requestBody: { first: 'brian' },
          allRequestResponses: [allRequestResponse],
        })

        cy.request({
          url: 'http://localhost:8080/foo',
          headers: { 'x-token': 'abc123' },
          method: 'POST',
          body: { first: 'brian' },
        })
        .then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'request',
            type: 'command',
            props: {
              Request: allRequestResponse,
              Yielded: {
                duration: 10,
                status: 201,
                body: { id: 123 },
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            },
          })
        })
      })

      it('.consoleProps with array of allRequestResponses', () => {
        const allRequestResponses = [{
          'Request URL': 'http://localhost:8080/foo',
          'Request Headers': { 'x-token': 'ab123' },
          'Request Body': { first: 'brian' },
          'Response Headers': {
            'Content-Type': 'application/json',
          },
          'Response Body': { id: 123 },
        }, {
          'Request URL': 'http://localhost:8080/foo',
          'Request Headers': { 'x-token': 'ab123' },
          'Request Body': { first: 'brian' },
          'Response Headers': {
            'Content-Type': 'application/json',
          },
          'Response Body': { id: 123 },
        }]

        Cypress.backend
        .withArgs('http:request')
        .resolves({
          duration: 10,
          status: 201,
          isOkStatusCode: true,
          body: { id: 123 },
          headers: {
            'Content-Type': 'application/json',
          },
          requestHeaders: { 'x-token': 'ab123' },
          requestBody: { first: 'brian' },
          allRequestResponses,
        })

        cy.request({
          url: 'http://localhost:8080/foo',
          headers: { 'x-token': 'abc123' },
          method: 'POST',
          body: { first: 'brian' },
        })
        .then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            name: 'request',
            type: 'command',
            props: {
              Requests: allRequestResponses,
              Yielded: {
                duration: 10,
                status: 201,
                body: { id: 123 },
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            },
          })
        })
      })

      describe('.renderProps', () => {
        describe('in any case', () => {
          it('sends correct message', () => {
            Cypress.backend
            .withArgs('http:request')
            .resolves({ isOkStatusCode: true, status: 201 })

            cy.request('http://localhost:8080/foo').then(function () {
              expect(this.lastLog.invoke('renderProps').message).to.equal('GET 201 http://localhost:8080/foo')
            })
          })
        })

        describe('when request origin equals browsers origin', () => {
          it('sends correct message', () => {
            Cypress.backend
            .withArgs('http:request')
            .resolves({ isOkStatusCode: true, status: 201 })

            cy.request(`${window.location.origin}/foo`).then(function () {
              expect(this.lastLog.invoke('renderProps').message).to.equal('GET 201 /foo')
            })
          })
        })

        describe('when response is successful', () => {
          it('sends correct indicator', () => {
            Cypress.backend
            .withArgs('http:request')
            .resolves({ isOkStatusCode: true, status: 201 })

            cy.request('http://localhost:8080/foo').then(function () {
              expect(this.lastLog.invoke('renderProps').indicator).to.equal('successful')
            })
          })
        })

        describe('when response is outside 200 range', () => {
          it('sends correct indicator', function (done) {
            cy.on('fail', (err) => {
              expect(this.lastLog.invoke('renderProps').indicator).to.equal('bad')

              done()
            })

            Cypress.backend
            .withArgs('http:request')
            .resolves({ status: 500 })

            cy.request('http://localhost:8080/foo')
          })
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'request') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('throws when no url is passed', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` requires a `url`. You did not provide a `url`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request()
      })

      it('throws when url is not FQDN', {
        baseUrl: null,
      }, function (done) {
        cy.stub(cy, 'getRemoteLocation').withArgs('origin').returns('')

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` must be provided a fully qualified `url` - one that begins with `http`. By default `cy.request()` will use either the current window\'s origin or the `baseUrl` in `cypress.config.ts`. Neither of those values were present.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request('/foo/bar')
      })

      it('throws when url is not FQDN, notes that configFile is non-default', {
        baseUrl: null,
        configFile: 'foo.json',
      }, function (done) {
        cy.stub(cy, 'getRemoteLocation').withArgs('origin').returns('')

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` must be provided a fully qualified `url` - one that begins with `http`. By default `cy.request()` will use either the current window\'s origin or the `baseUrl` in `foo.json`. Neither of those values were present.')

          done()
        })

        cy.request('/foo/bar')
      })

      it('throws when url isnt a string', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` requires the `url` to be a string.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: [],
        })
      })

      it('throws when auth is truthy but not an object', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` must be passed an object literal for the `auth` option.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          auth: 'foobar',
        })
      })

      it('throws when headers is truthy but not an object', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` requires the `headers` option to be an object literal.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          headers: 'foo=bar',
        })
      })

      it('throws on invalid method', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` was called with an invalid method: `FOO`. Method can be: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`, or any other method supported by Node\'s HTTP parser.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          method: 'FOO',
        })
      })

      it('throws when gzip is not boolean', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` requires the `gzip` option to be a boolean.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          gzip: {},
        })
      })

      it('throws when encoding is not valid', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` was called with invalid encoding: `binaryX`. Encoding can be: `utf8`, `utf16le`, `latin1`, `base64`, `hex`, `ascii`, `binary`, `latin1`, `ucs2`, `utf16le`, or any other encoding supported by Node\'s Buffer encoding.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          encoding: 'binaryX',
        })
      })

      it('throws when form isnt a boolean', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.message).to.eq('`cy.request()` requires the `form` option to be a boolean.\n\nIf you\'re trying to send a `x-www-form-urlencoded` request then pass either a string or object literal to the `body` property.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://localhost:1234/foo',
          form: { foo: 'bar' },
        })
      })

      it('throws when failOnStatusCode is false and retryOnStatusCodeFailure is true', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` was invoked with `{ failOnStatusCode: false, retryOnStatusCodeFailure: true }`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })

        cy.request({
          url: 'http://foobarbaz',
          failOnStatusCode: false,
          retryOnStatusCodeFailure: true,
        })
      })

      it('throws when status code doesnt start with 2 and failOnStatusCode is true', function (done) {
        Cypress.backend
        .withArgs('http:request')
        .resolves({
          isOkStatusCode: false,
          status: 500,
          statusText: 'Server Error',
          headers: {
            baz: 'quux',
          },
          body: 'response body',
          requestHeaders: {
            foo: 'bar',
          },
          requestBody: 'request body',
          redirects: [
            '301: http://www.google.com',
          ],
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')
          expect(err.message).to.include(stripIndent`\
            \`cy.request()\` failed on:

            http://localhost:1234/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not \`2xx\` or \`3xx\`.

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`

            -----------------------------------------------------------

            The request we sent was:

            Method: POST
            URL: http://localhost:1234/foo
            Headers: {
              \"foo\": \"bar\"
            }
            Body: request body
            Redirects: [
              \"301: http://www.google.com\"
            ]

            -----------------------------------------------------------

            The response we got was:

            Status: 500 - Server Error
            Headers: {
              \"baz\": \"quux\"
            }
            Body: response body`)

          done()
        })

        cy.request({
          method: 'POST',
          url: 'http://localhost:1234/foo',
          body: {
            username: 'cypress',
          },
        })
      })

      // https://github.com/cypress-io/cypress/issues/4346
      it('throws on network failure when nested', (done) => {
        cy.request('http://localhost:3500/dump-method')
        .then(() => {
          cy.request('http://0.0.0.0:12345')
        })

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.request()` failed trying to load:')

          done()
        })
      })

      it('displays body_circular when body is circular', function (done) {
        const foo = {
          bar: {
            baz: {},
          },
        }

        foo.bar.baz.quux = foo

        cy.request({
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
            The \`body\` parameter supplied to \`cy.request()\` contained a circular reference at the path "bar.baz.quux".

            \`body\` can only be a string or an object with no circular references.`)

          expect(err.docsUrl).to.eq('https://on.cypress.io/request')

          done()
        })
      })

      it('does not include redirects when there were no redirects', function (done) {
        Cypress.backend
        .withArgs('http:request')
        .resolves({
          isOkStatusCode: false,
          status: 500,
          statusText: 'Server Error',
          headers: {
            baz: 'quux',
          },
          body: 'response body',
          requestHeaders: {
            foo: 'bar',
          },
          requestBody: 'request body',
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')
          expect(err.docsUrl).to.eq('https://on.cypress.io/request')
          expect(err.message).to.include(stripIndent`\
            \`cy.request()\` failed on:

            http://localhost:1234/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not \`2xx\` or \`3xx\`.

            If you do not want status codes to cause failures pass the option: \`failOnStatusCode: false\`

            -----------------------------------------------------------

            The request we sent was:

            Method: POST
            URL: http://localhost:1234/foo
            Headers: {
              \"foo\": \"bar\"
            }
            Body: request body

            -----------------------------------------------------------

            The response we got was:

            Status: 500 - Server Error
            Headers: {
              \"baz\": \"quux\"
            }
            Body: response body`)

          done()
        })

        cy.request({
          method: 'POST',
          url: 'http://localhost:1234/foo',
          body: {
            username: 'cypress',
          },
        })
      })

      it('logs once on error', function (done) {
        const error = new Error('request failed')

        error.backend = true

        Cypress.backend
        .withArgs('http:request')
        .rejects(error)

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('state')).to.eq('failed')

          done()
        })

        cy.request('http://localhost:1234/foo')
      })

      // https://github.com/cypress-io/cypress/issues/5274
      it('dont throw UNESCAPED_CHARACTERS error for url with ’ character in pathname', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` failed trying to load:')
          expect(err.message).to.not.contain('ERR_UNESCAPED_CHARACTERS')

          done()
        })

        cy.request('http://localhost:1234/’')
      })

      it('dont throw UNESCAPED_CHARACTERS error for url with % character in pathname', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` failed trying to load:')
          expect(err.message).to.not.contain('ERR_UNESCAPED_CHARACTERS')

          done()
        })

        cy.request('http://localhost:1234/%')
      })

      it('dont throw UNESCAPED_CHARACTERS error for url with ’ escaped in pathname', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` failed trying to load:')
          expect(err.message).to.not.contain('ERR_UNESCAPED_CHARACTERS')

          done()
        })

        cy.request(encodeURI('http://localhost:1234/’'))
      })

      it('dont throw UNESCAPED_CHARACTERS error for url with Unicode in pathname from BMP to Astral Plane', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` failed trying to load:')
          expect(err.message).to.not.contain('ERR_UNESCAPED_CHARACTERS')

          done()
        })

        cy.request('http://localhost:1234/😀')
      })

      it('dont throw UNESCAPED_CHARACTERS error for url with any Unicode escaped character in pathname', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.request()` failed trying to load:')
          expect(err.message).to.not.contain('ERR_UNESCAPED_CHARACTERS')

          done()
        })

        cy.request(encodeURI('http://localhost:1234/😀'))
      })

      context('displays error', () => {
        it('displays method and url in error', (done) => {
          const error = new Error('request failed')

          error.backend = true

          Cypress.backend
          .withArgs('http:request')
          .rejects(error)

          cy.on('fail', (err) => {
            expect(err.message).to.include(stripIndent`\
              \`cy.request()\` failed trying to load:

              http://localhost:1234/foo

              We attempted to make an http request to this URL but the request failed without a response.

              We received this error at the network level:

                > request failed

              -----------------------------------------------------------

              The request we sent was:

              Method: GET
              URL: http://localhost:1234/foo

              -----------------------------------------------------------

              Common situations why this would fail:
                - you don't have internet access
                - you forgot to run / boot your web server
                - your web server isn't accessible
                - you have weird network configuration settings on your computer`)

            expect(err.docsUrl).to.eq('https://on.cypress.io/request')

            done()
          })

          cy.request('http://localhost:1234/foo')
        })

        it('throws after timing out', function (done) {
          Cypress.backend
          .withArgs('http:request')
          .resolves(Promise.delay(1000))

          cy.on('fail', (err) => {
            const {
              lastLog,
            } = this

            assertLogLength(this.logs, 1)
            expect(lastLog.get('error')).to.eq(err)
            expect(lastLog.get('state')).to.eq('failed')
            expect(err.docsUrl).to.eq('https://on.cypress.io/request')
            expect(err.message).to.eq(stripIndent`\
              \`cy.request()\` timed out waiting \`50ms\` for a response from your server.

              The request we sent was:

              Method: GET
              URL: http://localhost:1234/foo

              No response was received within the timeout.`)

            done()
          })

          cy.request({ url: 'http://localhost:1234/foo', timeout: 50 })
        })
      })
    })
  })
})
