describe('Proxy Logging', () => {
  const { $ } = Cypress

  it.only('demo', () => {
    cy.intercept('/intercepted').as('anIntercept')
    cy.get('body').as('someGet')
    // .wait('@someGet')
    .get('@someGet')

    // cy.intercept('**/*.css')
    // cy.visit('http://docs.cypress.io')
    // cy.intercept('*')
    cy.server()
    cy.route('/routed').as('aRoute')
    cy.route('/routed-stub', 'foo').as('aRouteStub')
    cy.route('/bothmatch').as('bothMatchR')
    cy.intercept('/bothmatch').as('bothMatchI')
    cy.intercept('/overlap', 'k').as('overlapA')
    cy.intercept('/overlap').as('overlapB')
    cy.intercept('/modify-req', (req) => {
      req.headers.foo = 'bar'
    }).as('modifyReq')

    cy.intercept('/modify-res', (req) => {
      req.continue((res) => {
        res.headers.foo = 'bar'
      })
    }).as('modifyRes')

    cy.intercept('/modify-both', (req) => {
      req.headers.foo = 'bar'
      req.continue((res) => {
        res.headers.foo = 'bar'
      })
    })

    // cy.intercept('/modify-req-res').as('modifyReqRes')
    cy.window().then(({ XMLHttpRequest }) => {
      cy.log('👁 Unmatched XHR:')
      .then(() => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/unmatched-xhr')
        xhr.send()
      })
      .log('👁 cy.route matched XHR spy:')
      .then(() => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/routed')
        xhr.send()
      })
      .log('👁 cy.route matched XHR stub:')
      .then(() => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/routed-stub')
        xhr.send()
      })
      .log('👁 cy.route and cy.intercept match:')
      .then(() => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/bothmatch')
        xhr.send()
      })
      .log('👁 only cy.intercept matches a fetch:')
      .then(() => {
        fetch('/bothmatch')
      })
      .wait('@bothMatchI').wait('@bothMatchI')
      .log('👁 with a few matching intercepts')
      .then(() => {
        fetch('/overlap')
      })
      .wait('@overlapA')
      .log('👁 with req/res modification')
      .then(() => {
        fetch('/modify-req')
        fetch('/modify-res')
        fetch('/modify-both')
      })
    })
  })

  it('intercepted cy.visits do not wait for a pre-request', () => {
    cy.intercept('*', () => {})

    cy.visit('/fixtures/empty.html', { timeout: 100 })
  })

  let logs: Cypress.Log[]

  beforeEach(() => {
    logs = []
  })

  it('logs fetches', (done) => {
    let logChanged = false

    fetch('/something')

    cy.once('log:added', (log) => {
      // the log should be pending
      expect(log).to.include({
        name: 'xhr',
        displayName: 'fetch',
        method: 'GET',
        url: 'http://localhost:3500/something',
      })

      expect(log.renderProps).to.include({
        message: 'GET /something',
        indicator: 'pending',
      })

      expect(log.consoleProps).to.include({
        Method: 'GET',
        URL: 'http://localhost:3500/something',
        'Resource Type': 'fetch',
      })

      expect(log.consoleProps['Request Headers']).to.have.property('User-Agent')
      expect(log.consoleProps).to.not.have.property('Response Headers')

      cy.on('log:changed', (log) => {
        if (logChanged || log.renderProps.indicator === 'pending') {
          return
        }

        // the log should be done
        logChanged = true

        expect(log).to.include({
          name: 'xhr',
          displayName: 'fetch',
          method: 'GET',
          url: 'http://localhost:3500/something',
        })

        expect(log.renderProps).to.include({
          message: 'GET 404 /something',
          indicator: 'bad',
        })

        expect(log.consoleProps['Response Headers']).to.have.property('date')
        expect(log.consoleProps['Response Status Code']).to.eq(404)

        done()
      })
    })
  })

  context('with cy.route', () => {
    it('unmatched xhrs are correlated', (done) => {
      let xhrLogCount = 0

      // cy.on('log:added', ({ name }) => name === 'xhr' && xhrLogCount++)
      cy.window()
      .then(({ XMLHttpRequest }) => {
        const logChanges: any[] = []

        // cy.on('log:changed', (log) => logChanges.push(log))
        // cy.on('log:added', (log) => {
        //   logs.push(log)
        //   console.log('added:', log, log.browserPreRequest)
        // })

        // cy.on('log:changed', (log) => {
        //   console.log('changed: ', log.browserPreRequest)
        // })

        // cy.once('log:changed', (log) => {
        //   // window parent log updates first
        //   expect(log).to.include({ name: 'window' })
        //   cy.once('log:changed', (log) => {
        //     // next the proxy-logging log will be updated with the intercept
        //     expect(log).to.include({
        //       name: 'xhr',
        //       displayName: 'xhr',
        //     })

        //     // because there was a pre-request, this should exist on the log object
        //     expect(log.browserPreRequest).to.include({
        //       method: 'GET',
        //       // url: log.url,
        //     })

        //     expect(xhrLogCount).to.eq(1)

        //     done()
        //   })
        // })

        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/foo')
        xhr.send()

        xhr.onload = () => {
          const last = logChanges[logChanges.length - 1]
        }
      })
    })
  })

  context('with cy.intercept', () => {
    it('intercepted fetches are correlated', (done) => {
      let xhrLogCount = 0

      const expectIntercept = (log) => {
        // next the proxy-logging log will be updated with the intercept
        expect(log).to.include({
          name: 'xhr',
          displayName: 'intercept',
          url: 'http://localhost:3500/foo',
        })

        // because there was a pre-request, this should exist on the log object
        expect(log.browserPreRequest).to.include({
          method: 'GET',
          url: log.url,
        })

        expect(xhrLogCount).to.eq(1)

        done()
      }

      cy.on('log:added', ({ name }) => name === 'xhr' && xhrLogCount++)
      cy.intercept('/foo')
      .then(() => {
        // cy.once('log:changed', (log) => {
        //   // route instrument log updates first
        //   expect(log).to.include({ name: 'route' })
        //   cy.once('log:changed', (log) => {
        //     try {
        //       expectIntercept(log)
        //     } catch (err) {
        //       cy.log('expectIntercept failed:', log)
        //       cy.once('log:changed', expectIntercept)
        //     }
        //   })
        // })

        fetch('/foo')
      })
    })
  })

  context('with both', () => {

  })

  context.skip('', () => {
    it('when there is a fetch with no matching `cy.route()` or `cy.intercept()`', async () => {
      await fetch('/')
    })

    it('when there is an XHR with no matching `cy.route` or `cy.intercept`', (done) => {
      $.get('/').fail(() => done())
    })

    it('when there is 1 matching `cy.intercept()`', () => {
      cy.intercept('/something*').as('get')
      .then(() => {
        $.get('/something')
      })
      .wait('@get')
    })

    it('when there is 1 matching `cy.intercept()` stub', () => {
      cy.visit('/fixtures/dom.html')
      cy.get('body', { timeout: 500, log: true, includeShadowDom: true })
      cy.intercept('/stubbed*', 'foo').as('foo')
      cy.intercept('/spied*').as('bar')

      .then(() => {
        fetch('/another')
        fetch('/anotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranotheranother')
        $.get('/spied')
        $.get('/stubbed')
      })
      .wait('@foo', { requestTimeout: 500, responseTimeout: 500 })
      .wait('@bar')
    })

    it('when there is 1 matching `cy.route()`', () => {
      cy.server()
      cy.route('/something').as('get')
      .window().then(({ XMLHttpRequest }) => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/something')
        xhr.send()
      })
      .wait('@get')
    })

    it('when there is a matching `cy.route()` and a matching `cy.intercept()`', () => {
      cy.intercept('/something*').as('intercept')
      .server()
      .route('/something').as('route')
      .window().then(({ XMLHttpRequest }) => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/something')
        xhr.send()

        return new Promise((resolve) => xhr.onload = resolve)
      })
      .wait('@route')
      .wait('@intercept')
    })

    it('when there are multiple matching `cy.route()`s/`cy.intercept()`s', () => {
      cy.intercept('/some/thing').as('intercept')
      cy.intercept('/some/*', (req) => {
        req.headers['x-foo'] = 'hi'
      }).as('intercept2')
      .server()
      .route('/some/thing').as('route')
      .window().then(({ XMLHttpRequest }) => {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/some/thing')
        xhr.send()

        return new Promise((resolve) => xhr.onload = resolve)
      })
      .wait('@route')
      .wait('@intercept')
      .wait('@intercept2')
    })
  })
})
