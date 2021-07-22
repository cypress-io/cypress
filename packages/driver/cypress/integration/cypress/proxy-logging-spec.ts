describe('Proxy Logging', () => {
  const { _ } = Cypress

  const url = '/testFlag'
  const alias = 'aliasName'

  function testFlag (expectStatus, expectInterceptions, setupFn, getFn) {
    return () => {
      setupFn()

      let resolve
      const p = new Promise((_resolve) => resolve = _resolve)

      function testLog (log) {
        expect(log.alias).to.eq(expectStatus ? alias : undefined)
        expect(log.renderProps).to.deep.include({
          status: expectStatus,
          interceptions: expectInterceptions,
        })

        resolve()
      }

      cy.then(() => {
        cy.on('log:changed', (log) => {
          if (log.name === 'xhr') {
            try {
              testLog(log)
              resolve()
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('assertions failed:', err)
            }
          }
        })

        getFn(url)
      }).then(() => p)

      if (expectStatus) {
        cy.wait(`@${alias}`)
      }
    }
  }

  beforeEach(() => {
    // block race conditions caused by log update debouncing
    // @ts-ignore
    Cypress.config('logAttrsDelay', 0)
  })

  context('request logging', () => {
    it('fetch log shows resource type, url, method, and status code and has expected snapshots and consoleProps', (done) => {
      fetch('/some-url')

      // trigger: Cypress.Log() called
      cy.once('log:added', (log) => {
        expect(log.snapshots).to.be.undefined
        expect(log.displayName).to.eq('fetch')
        expect(log.renderProps).to.include({
          indicator: 'pending',
          message: 'GET /some-url',
        })

        expect(log.consoleProps).to.include({
          Method: 'GET',
          'Resource Type': 'fetch',
          'URL': 'http://localhost:3500/some-url',
        })

        // case depends on browser
        const refererKey = _.keys(log.consoleProps['Request Headers']).find((k) => k.toLowerCase() === 'referer')

        expect(log.consoleProps['Request Headers']).to.include({
          [refererKey]: window.location.href,
        })

        expect(log.consoleProps).to.not.have.property('Response Headers')
        expect(log.consoleProps).to.not.have.property('Matched `cy.intercept()`s')

        // trigger: .snapshot('request')
        cy.once('log:changed', (log) => {
          expect(log.snapshots.map((v) => v.name)).to.deep.eq(['request'])

          // trigger: .snapshot('response')
          cy.once('log:changed', (log) => {
            expect(log.snapshots.map((v) => v.name)).to.deep.eq(['request', 'response'])
            expect(log.consoleProps['Response Headers']).to.include({
              'x-powered-by': 'Express',
            })

            expect(log.consoleProps).to.not.have.property('Matched `cy.intercept()`s')
            expect(log.renderProps).to.include({
              indicator: 'bad',
              message: 'GET 404 /some-url',
            })

            done()
          })
        })
      })
    })

    it('does not log an unintercepted non-xhr/fetch request', (done) => {
      const img = new Image()
      const logs: any[] = []
      let imgLoaded = false

      cy.on('log:added', (log) => {
        if (imgLoaded) return

        logs.push(log)
      })

      img.onload = () => {
        imgLoaded = true
        expect(logs).to.have.length(0)
        done()
      }

      img.src = `/fixtures/media/cypress.png?${Date.now()}`
    })

    context('with cy.intercept()', () => {
      it('shows non-xhr/fetch log if intercepted', (done) => {
        const src = `/fixtures/media/cypress.png?${Date.now()}`

        cy.intercept('/fixtures/**/*.png*')
        .then(() => {
          cy.once('log:added', (log) => {
            expect(log.displayName).to.eq('image')
            expect(log.renderProps).to.include({
              indicator: 'pending',
              message: `GET ${src}`,
            })

            done()
          })

          const img = new Image()

          img.src = src
        })
      })

      it('shows cy.visit if intercepted', () => {
        cy.intercept('/fixtures/empty.html')
        .then(() => {
          // trigger: cy.visit()
          cy.once('log:added', (log) => {
            expect(log.name).to.eq('visit')
            // trigger: intercept Cypress.Log
            cy.once('log:added', (log) => {
              expect(log.displayName).to.eq('document')
            })
          })
        })
        .visit('/fixtures/empty.html')
      })

      context('flags', () => {
        const testFlagFetch = (expectStatus, expectInterceptions, setupFn) => {
          return testFlag(expectStatus, expectInterceptions, setupFn, (url) => fetch(url))
        }

        it('is unflagged when not intercepted', testFlagFetch(
          undefined,
          [],
          () => {},
        ))

        it('spied flagged as expected', testFlagFetch(
          'spied',
          [{
            command: 'intercept',
            alias,
            type: 'spy',
          }],
          () => {
            cy.intercept(url).as(alias)
          },
        ))

        it('spy function flagged as expected', testFlagFetch(
          'spied',
          [{
            command: 'intercept',
            alias,
            type: 'function',
          }],
          () => {
            cy.intercept(url, () => {}).as(alias)
          },
        ))

        it('stubbed flagged as expected', testFlagFetch(
          'stubbed',
          [{
            command: 'intercept',
            alias,
            type: 'stub',
          }],
          () => {
            cy.intercept(url, 'stubbed response').as(alias)
          },
        ))

        it('req modified flagged as expected', testFlagFetch(
          'req modified',
          [{
            command: 'intercept',
            alias,
            type: 'function',
          }],
          () => {
            cy.intercept(url, (req) => {
              req.headers.foo = 'bar'
            }).as(alias)
          },
        ))

        it('res modified flagged as expected', testFlagFetch(
          'res modified',
          [{
            command: 'intercept',
            alias,
            type: 'function',
          }],
          () => {
            cy.intercept(url, (req) => {
              req.continue((res) => {
                res.headers.foo = 'bar'
              })
            }).as(alias)
          },
        ))

        it('req + res modified flagged as expected', testFlagFetch(
          'req + res modified',
          [{
            command: 'intercept',
            alias,
            type: 'function',
          }],
          () => {
            cy.intercept(url, (req) => {
              req.headers.foo = 'bar'
              req.continue((res) => {
                res.headers.foo = 'bar'
              })
            }).as(alias)
          },
        ))
      })
    })

    context('with cy.route()', () => {
      context('flags', () => {
        let $XMLHttpRequest

        const testFlagXhr = (expectStatus, expectInterceptions, setupFn) => {
          return testFlag(expectStatus, expectInterceptions, setupFn, (url) => {
            const xhr = new $XMLHttpRequest()

            xhr.open('GET', url)
            xhr.send()
          })
        }

        beforeEach(() => {
          cy.window()
          .then(({ XMLHttpRequest }) => {
            $XMLHttpRequest = XMLHttpRequest
          })
        })

        it('is unflagged when not routed', testFlagXhr(
          undefined,
          [],
          () => {},
        ))

        it('spied flagged as expected', testFlagXhr(
          'spied',
          [{
            command: 'route',
            alias,
            type: 'spy',
          }],
          () => {
            cy.server()
            cy.route(`${url}`).as(alias)
          },
        ))

        it('stubbed flagged as expected', testFlagXhr(
          'stubbed',
          [{
            command: 'route',
            alias,
            type: 'stub',
          }],
          () => {
            cy.server()
            cy.route(url, 'stubbed response').as(alias)
          },
        ))
      })
    })
  })
})
