import { testFail, uniqueRoute, usesBrowserNetworkPath } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('waiting and aliasing', { defaultCommandTimeout: 10000 }, function () {
    const testFailWaiting = (cb) => testFail(cb, 'https://on.cypress.io/wait')

    it('can wait on a single response using "alias"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
    })

    it('can timeout waiting on a single response using "alias"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can wait on a single response using "alias.response"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.response')
    })

    it('can timeout waiting on a single response using "alias.response"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.response', { timeout: 100 })
    })

    it('can wait on a single request using "alias.request"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`)
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
    })

    it('can timeout waiting on a single request using "alias.request"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No request ever occurred.')
        done()
      })

      cy.intercept(`${url}*`)
      .as('foo.bar')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can incrementally wait on responses', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
    })

    it('can timeout incrementally waiting on responses', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('for the 1st response to the route')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
        $.get(url)
      })
      .wait('@foo.bar', { timeout: 500 })
      .wait('@foo.bar', { timeout: 500 })
    })

    it('can incrementally wait on requests', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
    })

    it('can timeout incrementally waiting on requests', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('for the 2nd request to the route')
        done()
      })

      cy.intercept(`${url}*`, (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('does not hang when waiting on multiple aliases across navigation', function (done) {
      const triggerUrl = uniqueRoute('/trigger-navigation')
      const neverAUrl = uniqueRoute('/never-a')
      const neverBUrl = uniqueRoute('/never-b')
      const slowPageUrl = '/fixtures/empty.html?stability-repro=1'

      testFailWaiting((err) => {
        expect(err.message).to.contain('`cy.wait()` timed out waiting')
        done()
      })

      cy.intercept(`${triggerUrl}*`, 'ok').as('trigger')
      cy.intercept(`${neverAUrl}*`).as('neverA')
      cy.intercept(`${neverBUrl}*`).as('neverB')
      cy.intercept('/fixtures/empty.html?stability-repro=1', {
        delay: 2000,
        fixture: 'empty.html',
      })
      .then(() => {
        const win = cy.state('window')

        setTimeout(() => {
          $.get(triggerUrl).always(() => {
            win.location.href = slowPageUrl
          })
        }, 50)
      })
      .wait(['@neverA', '@neverB', '@trigger'], { timeout: 300 })
    })

    it('can alias a route without stubbing it', function () {
      cy.intercept(/fixtures\/app/).as('getFoo').then(function () {
        $.get('/fixtures/app.json')
      }).wait('@getFoo').then(function (res) {
        const log = cy.queue.logs({
          displayName: 'xhr',
        })[0]

        expect(log.get('alias')).to.eq('getFoo')

        expect(res.response!.body).to.deep.eq({
          some: 'json',
          foo: {
            bar: 'baz',
          },
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8999
    it('can spy on a 204 no body response', function () {
      cy.intercept('/status-code*').as('status')
      .then(() => {
        $.get('/status-code?code=204')
      })
      .wait('@status').its('response.statusCode').should('eq', 204)
    })

    // @see https://github.com/cypress-io/cypress/issues/8934
    // TODO(webkit): fix+unskip. currently fails in WK because cache is disabled
    it('can spy on a 304 not modified image response', { browser: '!webkit' }, function () {
      const url = `/fixtures/media/cypress.png?i=${Date.now()}`

      cy.intercept(url).as('image')
      .then(() => {
        $.get({ url, cache: true })
      })
      .then(() => {
        if (Cypress.isBrowser('firefox')) {
          // strangely, Firefox requires some time to be waited before the first image response will be cached
          cy.wait(1000)
        }
      })
      .then(() => {
        $.get({ url, cache: true })
      })
      .wait('@image').its('response.statusCode').should('eq', 200)
      // NOTE: accepted MITM → CDP drift (#34611): the browser resolves the
      // revalidation against its own cache before the Fetch pause, so the second
      // response is reported as a 200 instead of the origin's 304.
      .wait('@image').its('response.statusCode').should('eq', usesBrowserNetworkPath ? 200 : 304)
    })

    // https://github.com/cypress-io/cypress/issues/14522
    it('different aliases are used for the same url', () => {
      cy.intercept('/status-code*').as('status')
      .then(() => {
        $.get('/status-code?code=204')
      })
      .wait('@status').its('response.statusCode').should('eq', 204)

      cy.intercept('/status-code*').as('status2')
      .then(() => {
        $.get('/status-code?code=301')
      })
      .wait('@status').its('response.statusCode').should('eq', 301)
      .wait('@status2').its('response.statusCode').should('eq', 301)
    })

    context('abort and cancel', () => {
      // https://github.com/cypress-io/cypress/issues/9549
      it('should handle aborted requests', () => {
        cy.intercept('https://jsonplaceholder.cypress.io/todos/1').as('xhr')
        cy.visit('fixtures/xhr-abort.html')
        cy.get('#btn').click()
        cy.get('pre').contains('delectus') // response body renders to page
        cy.wait('@xhr')
      })

      it('stops waiting when an xhr request is canceled', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.intercept('POST', /users/, {
          body: { name: 'b' },
          delay: 2000,
        }).as('createUser')

        cy.window()
        .then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('POST', '/users/')
          xhr.send()

          // Firefox/Safari can cancel too quickly on reload unless the request is observed first.
          cy.wait('@createUser.request').then((interception) => {
            win.location.reload()

            cy.wrap(interception).its('state').should('eq', 'Errored')
          })
        })
      })

      it('stops waiting when an fetch request is canceled', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.intercept('POST', /users/, {
          body: { name: 'b' },
          delay: 2000,
        }).as('createUser')

        cy.window()
        .then((win) => {
          const controller = new AbortController()
          const { signal } = controller

          fetch('/users/', { signal, method: 'POST' }).catch((e) => {
          // do nothing on an abort
          })

          // Firefox/Safari can cancel too quickly unless the request is observed first.
          cy.wait('@createUser.request').then((interception) => {
            if (!Cypress.isBrowser({ family: 'chromium' })) {
              setTimeout(() => {
                controller.abort()
              }, 100)
            } else {
              controller.abort()
            }

            cy.wrap(interception).its('state').should('eq', 'Errored')
          })
        })
      })

      it('should resolve a handler based intercept when navigation cancels the request', () => {
        const alias = '🧪'

        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.intercept('POST', /users/, (req) => {
          req.alias = alias
          req.reply({
            body: { name: 'b' },
            delay: 2000,
          })
        })

        cy.window().then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('POST', '/users/')
          xhr.send()
        })

        cy.visit('http://localhost:3500/fixtures/generic.html?navigation=1')
        cy.wait(`@${alias}`).then(({ error, state }) => {
          const interceptionError = error as Error & { code?: string }

          expect(state).to.eq('Errored')
          expect({
            name: interceptionError.name,
            code: interceptionError.code,
            message: interceptionError.message,
          }).to.deep.equal({
            name: 'BrowserConnectionClosedError',
            code: 'ERR_BROWSER_CONNECTION_CLOSED',
            message: 'The browser closed the connection before the response completed.',
          })
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/9062
    it('can spy on a request using forceNetworkError', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, { forceNetworkError: true })
      .as('err')
      .then(() => {
        $.get(url)
      })
      .wait('@err').should('have.property', 'error')
      .and('include', {
        message: 'forceNetworkError called',
        name: 'Error',
      })
      .get('@err').should('not.have.property', 'response')
    })

    // @see https://github.com/cypress-io/cypress/issues/15823
    it('can override an alias using .as', function () {
      cy.intercept('/users*').as('getUsers')
      cy.intercept('/users*', { body: { data: 'fake data' }, statusCode: 200 }).as('getUsers')
      .then(() => {
        $.get('/users')
      })
      .wait('@getUsers')
    })

    // @see https://github.com/cypress-io/cypress/issues/16451
    it('yields the expected interception when two requests are raced', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, { times: 1 }, { delay: 100, body: 'bar' }).as('a')
      cy.intercept(`${url}*`, { times: 1 }, 'foo').as('a')
      cy.then(() => {
        $.get(url)
        $.get(url)
      })
      .wait('@a').its('response.body').should('eq', 'foo')
      .wait('@a').its('response.body').should('eq', 'bar')
    })

    // @see https://github.com/cypress-io/cypress/issues/9306
    context('cy.get(alias)', function () {
      it('gets the latest Interception by alias', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias').then((interception) => {
          cy.get('@alias').then((interception2) => {
            expect(interception).to.not.be.null
            expect(interception).to.eq(interception2)
          })
        })
      })

      it('gets all aliased Interceptions by alias.all', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias')

        cy.get('@alias.all').then((interceptions) => {
          expect(interceptions).to.have.length(2)
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/25448
      it('gets all aliased Interceptions by alias.all when assigning an alias using req.alias', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'alias'
          req.reply({ bar: 'baz' })
        })
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias')

        cy.get('@alias.all').then((interceptions) => {
          expect(interceptions).to.have.length(2)
        })
      })

      // TODO: fix+document this behavior
      // @see https://github.com/cypress-io/cypress/issues/7663
      it.skip('gets indexed Interception by alias.number', function () {
        let interception
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').then((_interception) => {
          interception = _interception
        }).wait('@alias')

        cy.get('@alias.0').then((interception2) => {
          expect(interception).to.not.be.null
          expect(interception).to.eq(interception2)
        })
      })

      it('gets per-request aliased Interceptions', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'alias'
          req.reply({ bar: 'baz' })
        })
        .then(() => {
          $.get(url)
        })
        .wait('@alias').then((interception) => {
          cy.get('@alias').then((interception2) => {
            expect(interception).to.not.be.null
            expect(interception).to.eq(interception2)
          })
        })
      })

      it('yields null when no requests have been made', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(url).as('foo')
        cy.get('@foo').should('be.null')
      })
    })

    context('with an intercepted request', function () {
      it('can dynamically alias the request', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        .then(() => {
          const log = cy.queue.logs({
            displayName: 'xhr',
          })[0]

          const renderProps = log.get('renderProps')()

          expect(renderProps.interceptions).to.have.length(1)
          expect(renderProps.interceptions[0]).to.have.property('alias')
          expect(renderProps.interceptions[0].alias).to.eq('fromInterceptor')
        })
      })

      it('can dynamically alias the request and get with @alias.all', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@fromInterceptor').wait('@fromInterceptor')
        .get('@fromInterceptor.all').should('have.length', 2)
      })

      it('can time out on a dynamic alias', function (done) {
        const url = uniqueRoute('/foo')

        testFailWaiting((err) => {
          expect(err.message).to.contain('for the 1st request to the route')
          done()
        })

        cy.intercept(url, (req) => {
          req.alias = 'fromInterceptor'
        })
        .wait('@fromInterceptor', { timeout: 100 })
      })

      it('dynamic aliases are fulfilled before route aliases', function (done) {
        const url = uniqueRoute('/foo')

        testFailWaiting((err) => {
          expect(err.message).to.contain('for the 1st request to the route: `fromAs`')
          done()
        })

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .as('fromAs')
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        // this will fail - dynamic aliasing maintains the existing wait semantics, including that each request can only be waited once
        .wait('@fromAs', { timeout: 100 })
      })

      it('fulfills both dynamic aliases when two are defined', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .intercept(`${url}*`, (req) => {
          expect(req.alias).to.be.undefined
          req.alias = 'fromInterceptor2'
        })
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        .wait('@fromInterceptor2')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8695
    context('yields request', function () {
      it('when not intercepted', function () {
        cy.intercept('/post-only').as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'some body')
      })

      it('when intercepted', function () {
        cy.intercept('/post-only', (req) => {
          req.body = 'changed'
        }).as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'changed')
      })

      it('when static response body is provided', function () {
        cy.intercept('/post-only', { static: 'response' }).as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'some body')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8536
    context('yields response', function () {
      const testResponse = (expectedBody, done) => {
        return () => {
          $.get('/xml')

          cy.wait('@foo').then((request) => {
            expect(request.response!.body).to.eq(expectedBody)
            done()
          })
        }
      }

      it('when not stubbed', function (done) {
        cy.intercept('/xml*').as('foo')
        .then(testResponse('<foo>bar</foo>', done))
      })

      it('when stubbed with StaticResponse', function (done) {
        cy.intercept('/xml*', 'something different')
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with req.reply', function (done) {
        cy.intercept('/xml*', (req) => req.reply('something different'))
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with res.send', function (done) {
        cy.intercept('/xml*', (req) => req.reply((res) => res.send('something different')))
        .as('foo')
        .then(testResponse('something different', done))
      })

      context('when stubbed with fixture', function () {
        it('with cy.intercept', function (done) {
          cy.intercept('/xml*', { fixture: 'null.json' })
          .as('foo')
          .then(testResponse('', done))
        })

        it('with req.reply', function (done) {
          cy.intercept('/xml*', (req) => req.reply({ fixture: 'null.json' }))
          .as('foo')
          .then(testResponse('', done))
        })

        it('with res.send', function (done) {
          cy.intercept('/xml*', (req) => {
            return req.continue((res) => {
              return res.send({
                fixture: 'null.json',
                headers: {
                  // since `res.headers['content-type'] is already 'application/xml' from origin,
                  // we must explicitly set the content-type to JSON here.
                  // luckily changing content-type like this is not a typical use case
                  'content-type': 'application/json',
                },
              })
            })
          })
          .as('foo')
          .then(testResponse('', done))
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/9580
    context('overwrite cy.intercept', () => {
      it('works with an alias by default', () => {
        const url = uniqueRoute('/foo')

        // sanity test before testing it with the cy.intercept overwrite
        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      // Command overwrites persist for the rest of the spec, so these two run
      // before any test in this context overwrites cy.intercept.
      // https://github.com/cypress-io/cypress/issues/3890
      it('stores intercept as an alias for a request made from the AUT window', () => {
        // sanity test before overwriting cy.intercept in the next test
        cy.visit('/fixtures/jquery.html').then((win) => {
          $(win.document.head).find('script').remove()
        })

        cy
        .intercept(/foo/, { body: 'my value' }).as('getFoo')
        .window().then((win) => {
          win.$.get('foo')

          return null
        })
        .wait('@getFoo').its('response.body').should('equal', 'my value')
      })

      it('stores intercept as an alias for a request made from the AUT window after overwrite', () => {
        let routeCalled

        cy.visit('/fixtures/jquery.html').then((win) => {
          $(win.document.head).find('script').remove()
        })

        Cypress.Commands.overwrite('intercept', (route, ...args) => {
          routeCalled = true

          return cy.log(`cy.intercept ${args.join(' ')}`)
          .then(() => {
            return route(...args)
          })
        })

        cy
        .intercept(/foo/, { body: 'my value' }).as('getFoo')
        .window().then((win) => {
          win.$.get('foo')

          return null
        })
        .wait('@getFoo').its('response.body').should('equal', 'my value')
        .then(() => {
          expect(routeCalled, 'route overwrite was called').to.be.true
        })
      })

      it('works with an alias and function', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', function (originalIntercept, ...args) {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      it('works with an alias and arrow function', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', (originalIntercept, ...args) => {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      it('works with dynamic alias', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', (originalIntercept, ...args) => {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'netAlias'
          req.reply('my value')
        })
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      // https://github.com/cypress-io/cypress/issues/14444
      it('can use dot in request alias', () => {
        cy.intercept('/users', (req) => {
          req.alias = 'get.url'
          req.reply('foo')
        })

        cy.window().then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('GET', '/users')
          xhr.send()
        })

        cy.wait('@get.url')
      })
    })
  })
})
