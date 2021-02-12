const { stripIndent } = require('common-tags')
const { _, $, Promise } = Cypress

describe('src/cy/commands/xhr', () => {
  before(() => {
    cy
    .visit('/fixtures/jquery.html')
    .then(function (win) {
      const h = $(win.document.head)

      h.find('script').remove()

      this.head = h.prop('outerHTML')
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    $(doc.head).empty().html(this.head)
    $(doc.body).empty().html(this.body)
  })

  context('#startXhrServer', () => {
    it('continues to be a defined properties', () => {
      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/foo')
        expect(xhr.onload).to.be.a('function')
        expect(xhr.onerror).to.be.a('function')
        expect(xhr.onreadystatechange).to.be.a('function')
      })
    })

    it('prevents infinite recursion', () => {
      let onloaded = false
      let onreadystatechanged = false

      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const handlers = ['onload', 'onerror', 'onreadystatechange']

        const wrap = () => {
          handlers.forEach((handler) => {
            const bak = xhr[handler]

            xhr[handler] = (...args) => {
              if (_.isFunction(bak)) {
                bak.apply(xhr, args)
              }
            }
          })
        }

        const xhr = new win.XMLHttpRequest

        xhr.addEventListener('readystatechange', wrap, false)
        xhr.onreadystatechange = function () {
          throw new Error('NOOO')
        }

        xhr.onreadystatechange
        xhr.onreadystatechange = () => {
          onreadystatechanged = true
        }

        xhr.open('GET', '/foo')
        xhr.onload = function () {
          throw new Error('NOOO')
        }

        xhr.onload
        xhr.onload = () => {
          onloaded = true
        }

        xhr.send()

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(onloaded).to.be.true
        expect(onreadystatechanged).to.be.true

        expect(xhr.status).to.eq(404)
      })
    })

    // NOTE: flaky about 50% of the time in Firefox...
    // temporarily skipping for now, but this needs
    // to be reenabled after launch once we have time
    // to look at the underlying failure cause
    it.skip('allows multiple readystatechange calls', () => {
      let responseStatuses = 0

      cy
      .server()
      .route({ url: /longtext.txt/ }).as('getLongText')
      .task('create:long:file')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 3) {
            return responseStatuses++
          }
        }

        xhr.open('GET', `/_test-output/longtext.txt?${Cypress._.random(0, 1e6)}`)
        xhr.send()

        return null
      })
      .wait('@getLongText').then((xhr) => {
        expect(responseStatuses).to.be.gt(1)

        expect(xhr.status).to.eq(200)
      })
    })

    // https://github.com/cypress-io/cypress/issues/5864
    it('does not exceed max call stack', () => {
      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/foo')

        // This tests an old bug where calling onreadystatechange's getter would
        // create nested wrapper functions and exceed the max stack depth when called.
        // 20000 nested calls should be enough to break the stack in most implementations
        xhr.onreadystatechange = () => {
          return {}
        }

        for (let i = 0; i < 20000; i++) {
          xhr.onreadystatechange()
        }

        xhr.send()

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(xhr.status).to.eq(404)
      })
    })

    it('works with jquery too', () => {
      let failed = false
      let onloaded = false

      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const handlers = ['onload', 'onerror', 'onreadystatechange']

        const wrap = function () {
          const xhr = this

          handlers.forEach((handler) => {
            const bak = xhr[handler]

            xhr[handler] = (...args) => {
              if (_.isFunction(bak)) {
                bak.apply(xhr, args)
              }
            }
          })
        }

        const { open } = win.XMLHttpRequest.prototype

        win.XMLHttpRequest.prototype.open = function (...args) {
          this.addEventListener('readystatechange', wrap, false)

          open.apply(this, args)
        }

        win.$.get('/foo')
        .fail(() => {
          failed = true
        })
        .always(() => {
          onloaded = true
        })

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(failed).to.be.true
        expect(onloaded).to.be.true
        expect(xhr.status).to.eq(404)
      })
    })

    it('calls existing onload handlers', () => {
      let onloaded = false

      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.onload = () => {
          onloaded = true
        }

        xhr.open('GET', '/foo')
        xhr.send()

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(onloaded).to.be.true
        expect(xhr.status).to.eq(404)
      })
    })

    it('calls onload handlers attached after xhr#send', () => {
      let onloaded = false

      cy
      .server()
      .route({ url: /foo/ }).as('getFoo')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/foo')
        xhr.send()
        xhr.onload = () => {
          return onloaded = true
        }

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(onloaded).to.be.true
        expect(xhr.status).to.eq(404)
      })
    })

    it('calls onload handlers attached after xhr#send asynchronously', () => {
      let onloaded = false

      cy
      .server()
      .route({ url: /timeout/ }).as('getTimeout')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/timeout?ms=100')
        xhr.send()
        _.delay(() => {
          xhr.onload = () => {
            onloaded = true
          }
        }, 20)

        return null
      })
      .wait('@getTimeout').then((xhr) => {
        expect(onloaded).to.be.true
        expect(xhr.status).to.eq(200)
      })
    })

    it('fallbacks even when onreadystatechange is overriden', () => {
      let onloaded = false
      let onreadystatechanged = false

      cy
      .server()
      .route({ url: /timeout/ }).as('get.timeout')
      .window().then((win) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/timeout?ms=100')
        xhr.send()
        xhr.onreadystatechange = () => {
          onreadystatechanged = true
        }

        xhr.onload = () => {
          onloaded = true
        }

        return null
      })
      .wait('@get.timeout').then((xhr) => {
        expect(onloaded).to.be.true
        expect(onreadystatechanged).to.be.true
        expect(xhr.status).to.eq(200)
      })
    })

    describe('url rewriting', () => {
      it('has a FQDN absolute-relative url', () => {
        cy
        .server()
        .route({
          url: /foo/,
        }).as('getFoo')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('/foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/foo')
          expect(this.open).to.be.calledWith('GET', '/foo')
        })
      })

      it('has a relative URL', () => {
        cy
        .server()
        .route(/foo/).as('getFoo')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/fixtures/foo')
          expect(this.open).to.be.calledWith('GET', 'foo')
        })
      })

      it('resolves relative urls correctly when base tag is present', () => {
        cy
        .server()
        .route({
          url: /foo/,
        }).as('getFoo')
        .window().then(function (win) {
          win.$('<base href=\'/\'>').appendTo(win.$('head'))
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/foo')
          expect(this.open).to.be.calledWith('GET', 'foo')
        })
      })

      it('resolves relative urls correctly when base tag is present on nested routes', () => {
        cy
        .server()
        .route({
          url: /foo/,
        }).as('getFoo')
        .window().then(function (win) {
          win.$('<base href=\'/nested/route/path\'>').appendTo(win.$('head'))
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('../foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/nested/foo')
          expect(this.open).to.be.calledWith('GET', '../foo')
        })
      })

      it('allows cross origin requests to go out as necessary', () => {
        cy
        .server()
        .route(/foo/).as('getFoo')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('http://localhost:3501/foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3501/foo')
          expect(this.open).to.be.calledWith('GET', 'http://localhost:3501/foo')
        })
      })

      it('rewrites FQDN url\'s for stubs', () => {
        cy
        .server()
        .route({
          url: /foo/,
          response: {},
        }).as('getFoo')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('http://localhost:9999/foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:9999/foo')
          expect(this.open).to.be.calledWith('GET', '/__cypress/xhrs/http://localhost:9999/foo')
        })
      })

      it('rewrites absolute url\'s for stubs', () => {
        cy
        .server()
        .route(/foo/, {}).as('getFoo')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('/foo')

          return null
        }).wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/foo')
          expect(this.open).to.be.calledWith('GET', '/__cypress/xhrs/http://localhost:3500/foo')
        })
      })

      it('rewrites 404\'s url\'s for stubs', () => {
        cy
        .server({ force404: true })
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')

          return new Promise((resolve) => {
            win.$.ajax({
              method: 'POST',
              url: '/foo',
              data: JSON.stringify({ foo: 'bar' }),
            }).fail(() => {
              resolve()
            })
          })
        })
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://localhost:3500/foo')
          expect(this.open).to.be.calledWith('POST', '/__cypress/xhrs/http://localhost:3500/foo')
        })
      })

      it('rewrites urls with nested segments', () => {
        cy
        .server()
        .route({
          url: /phones/,
          response: {},
        })
        .as('getPhones')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('phones/phones.json')

          return null
        })
        .wait('@getPhones')
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://localhost:3500/fixtures/phones/phones.json')
          expect(this.open).to.be.calledWith('GET', '/__cypress/xhrs/http://localhost:3500/fixtures/phones/phones.json')
        })
      })

      it('does not rewrite CORS', () => {
        cy.window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')

          return new Promise((resolve) => {
            win.$.get('http://www.google.com/phones/phones.json').fail(() => {
              resolve()
            })
          })
        })
        .then(function () {
          const { xhr } = cy.state('requests')[0]

          expect(xhr.url).to.eq('http://www.google.com/phones/phones.json')
          expect(this.open).to.be.calledWith('GET', 'http://www.google.com/phones/phones.json')
        })
      })

      it('can stub real CORS requests too', () => {
        cy
        .server()
        .route({
          url: /phones/,
          response: {},
        })
        .as('getPhones')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('http://www.google.com/phones/phones.json')

          return null
        })
        .wait('@getPhones')
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://www.google.com/phones/phones.json')
          expect(this.open).to.be.calledWith('GET', '/__cypress/xhrs/http://www.google.com/phones/phones.json')
        })
      })

      it('can stub CORS string routes', () => {
        cy
        .server()
        .route('http://localhost:3501/fixtures/app.json').as('getPhones')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('http://localhost:3501/fixtures/app.json')

          return null
        })
        .wait('@getPhones')
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://localhost:3501/fixtures/app.json')
          expect(this.open).to.be.calledWith('GET', 'http://localhost:3501/fixtures/app.json')
        })
      })

      it('sets display correctly when there is no remoteOrigin', () => {
        // this is an example of having cypress act as your webserver
        // when the remoteHost is <root>
        cy
        .server()
        .route({
          url: /foo/,
          response: {},
        })
        .as('getFoo')
        .window().then(function (win) {
          // trick cypress into thinking the remoteOrigin is location:9999
          cy.stub(cy, 'getRemoteLocation').withArgs('origin').returns('')
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('/foo')

          return null
        })
        .wait('@getFoo').then(function (xhr) {
          expect(xhr.url).to.eq('http://localhost:3500/foo')
          expect(this.open).to.be.calledWith('GET', '/__cypress/xhrs/http://localhost:3500/foo')
        })
      })

      it('decodes proxy urls', () => {
        cy
        .server()
        .route({
          url: /users/,
          response: {},
        })
        .as('getUsers')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('/users?q=(id eq 123)')

          return null
        })
        .wait('@getUsers')
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://localhost:3500/users?q=(id eq 123)')

          const url = encodeURI('users?q=(id eq 123)')

          expect(this.open).to.be.calledWith('GET', `/__cypress/xhrs/http://localhost:3500/${url}`)
        })
      })

      it('decodes proxy urls #2', () => {
        cy
        .server()
        .route(/accounts/, {}).as('getAccounts')
        .window().then(function (win) {
          this.open = cy.spy(cy.state('server').options, 'onOpen')
          win.$.get('/accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true')

          return null
        })
        .wait('@getAccounts')
        .then(function () {
          const { xhr } = cy.state('responses')[0]

          expect(xhr.url).to.eq('http://localhost:3500/accounts?page=1&$filter=(rowStatus+eq+1)&$orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true')

          const url = 'accounts?page=1&%24filter=(rowStatus+eq+1)&%24orderby=name+asc&includeOpenFoldersCount=true&includeStatusCount=true'

          expect(this.open).to.be.calledWith('GET', `/__cypress/xhrs/http://localhost:3500/${url}`)
        })
      })
    })

    describe('#onResponse', () => {
      it('calls onResponse callback with cy context + proxy xhr', (done) => {
        cy
        .server()
        .route({
          url: /foo/,
          response: { foo: 'bar' },
          onResponse (xhr) {
            expect(this).to.eq(cy)
            expect(xhr.responseBody).to.deep.eq({ foo: 'bar' })

            done()
          },
        })
        .window().then((win) => {
          win.$.get('/foo')

          return null
        })
      })
    })

    describe('#onAbort', () => {
      it('calls onAbort callback with cy context + proxy xhr', (done) => {
        cy
        .server()
        .route({
          url: /foo/,
          response: {},
          onAbort (xhr) {
            expect(this).to.eq(cy)
            expect(xhr.aborted).to.be.true

            done()
          },
        })
        .window().then((win) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/foo')
          xhr.send()
          xhr.abort()

          return null
        })
      })
    })

    describe('request parsing', () => {
      it('adds parses requestBody into JSON', (done) => {
        cy
        .server()
        .route({
          method: 'POST',
          url: /foo/,
          response: {},
          onRequest (xhr) {
            expect(this).to.eq(cy)
            expect(xhr.requestBody).to.deep.eq({ foo: 'bar' })

            done()
          },
        })
        .window().then((win) => {
          win.$.ajax({
            type: 'POST',
            url: '/foo',
            data: JSON.stringify({ foo: 'bar' }),
            dataType: 'json',
          })

          return null
        })
      })

      // https://github.com/cypress-io/cypress/issues/65
      it('provides the correct requestBody on multiple requests', () => {
        const post = function (win, obj) {
          win.$.ajax({
            type: 'POST',
            url: '/foo',
            data: JSON.stringify(obj),
            dataType: 'json',
          })

          return null
        }

        cy
        .server()
        .route('POST', /foo/, {}).as('getFoo')
        .window().then((win) => {
          return post(win, { foo: 'bar1' })
        })
        .wait('@getFoo').its('requestBody').should('deep.eq', { foo: 'bar1' })
        .window().then((win) => {
          return post(win, { foo: 'bar2' })
        })
        .wait('@getFoo').its('requestBody').should('deep.eq', { foo: 'bar2' })
      })

      it('handles arraybuffer', () => {
        cy
        .server()
        .route('GET', /arraybuffer/).as('getBuffer')
        .window().then((win) => {
          const xhr = new win.XMLHttpRequest

          xhr.responseType = 'arraybuffer'
          xhr.open('GET', '/arraybuffer')
          xhr.send()

          return null
        })
        .wait('@getBuffer').then((xhr) => {
          expect(xhr.status).eq(200)
          expect(xhr.responseBody.byteLength).gt(0)
          expect(xhr.responseBody.toString()).to.eq('[object ArrayBuffer]')
        })
      })

      it('handles xml', () => {
        cy
        .server()
        .route('GET', /xml/).as('getXML')
        .window().then((win) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/xml')
          xhr.send()

          return null
        })
        .wait('@getXML').its('responseBody').should('eq', '<foo>bar</foo>')
      })
    })

    describe('issue #84', () => {
      it('does not incorrectly match options', () => {
        cy
        .server()
        .route({
          method: 'GET',
          url: /answers/,
          status: 503,
          response: {},
        })
        .route(/forms/, []).as('getForm')
        .window().then((win) => {
          win.$.getJSON('/forms')

          return null
        })
        .wait('@getForm').its('status').should('eq', 200)
      })
    })

    describe('#issue #85', () => {
      it('correctly returns the right XHR alias', () => {
        cy
        .server()
        .route({
          method: 'POST',
          url: /foo/,
          response: {},
        })
        .as('getFoo')
        .route(/folders/, { foo: 'bar' }).as('getFolders')
        .window().then((win) => {
          win.$.getJSON('/folders')
          win.$.post('/foo', {})

          return null
        })
        .wait('@getFolders')
        .wait('@getFoo')
        .route(/folders/, { foo: 'baz' }).as('getFoldersWithSearch')
        .window().then((win) => {
          win.$.getJSON('/folders/123/activities?foo=bar')

          return null
        })
        .wait('@getFoldersWithSearch').its('url')
        .should('contain', '?foo=bar')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'xhr') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      context('requests', () => {
        it('immediately logs xhr obj', () => {
          cy
          .server()
          .route(/foo/, {}).as('getFoo')
          .window().then((win) => {
            win.$.get('foo')

            return null
          }).then(function () {
            const { lastLog } = this

            expect(lastLog.pick('name', 'displayName', 'event', 'alias', 'aliasType', 'state')).to.deep.eq({
              name: 'xhr',
              displayName: 'xhr stub',
              event: true,
              alias: 'getFoo',
              aliasType: 'route',
              state: 'pending',
            })

            const snapshots = lastLog.get('snapshots')

            expect(snapshots.length).to.eq(1)
            expect(snapshots[0].name).to.eq('request')
            expect(snapshots[0].body).to.be.an('object')
          })
        })

        // https://github.com/cypress-io/cypress/issues/8018
        it('logs empty string response as stubbed', () => {
          cy
          .server()
          .route(/foo/, '').as('getFoo')
          .window().then((win) => {
            win.$.get('foo')

            return null
          }).then(function () {
            const { lastLog } = this

            expect(lastLog.pick('name', 'displayName', 'event', 'alias', 'aliasType', 'state')).to.deep.eq({
              name: 'xhr',
              displayName: 'xhr stub',
              event: true,
              alias: 'getFoo',
              aliasType: 'route',
              state: 'pending',
            })

            const snapshots = lastLog.get('snapshots')

            expect(snapshots.length).to.eq(1)
            expect(snapshots[0].name).to.eq('request')
          })
        })

        it('does not end xhr requests when the associated command ends', () => {
          let logs = null

          cy
          .server()
          .route({
            url: /foo/,
            response: {},
            delay: 50,
          }).as('getFoo')
          .window().then((w) => {
            w.$.getJSON('foo')
            w.$.getJSON('foo')
            w.$.getJSON('foo')

            return null
          })
          .then(() => {
            const cmd = cy.queue.find({ name: 'window' })

            logs = cmd.get('next').get('logs')

            expect(logs.length).to.eq(3)

            _.each(logs, (log) => {
              expect(log.get('name')).to.eq('xhr')
              expect(log.get('end')).not.to.be.true
            })
          }).wait(['@getFoo', '@getFoo', '@getFoo']).then(() => {
            _.each(logs, (log) => {
              expect(log.get('name')).to.eq('xhr')
              expect(log.get('ended')).to.be.true
            })
          })
        })

        it('updates log immediately whenever an xhr is aborted', () => {
          let xhrs = null

          cy
          .server()
          .route({
            url: /foo/,
            response: {},
            delay: 50,
          }).as('getFoo')
          .window().then((win) => {
            const xhr1 = win.$.getJSON('foo1')

            win.$.getJSON('foo2')

            xhr1.abort()

            return null
          }).then(() => {
            xhrs = cy.queue.logs({ name: 'xhr' })

            expect(xhrs[0].get('state')).to.eq('failed')
            expect(xhrs[0].get('error').name).to.eq('AbortError')
            expect(xhrs[0].get('snapshots').length).to.eq(2)
            expect(xhrs[0].get('snapshots')[0].name).to.eq('request')
            expect(xhrs[0].get('snapshots')[0].body).to.be.a('object')
            expect(xhrs[0].get('snapshots')[1].name).to.eq('aborted')
            expect(xhrs[0].get('snapshots')[1].body).to.be.a('object')

            expect(cy.state('requests').length).to.eq(2)

            // the abort should have set its response
            expect(cy.state('responses').length).to.eq(1)
          })
          .wait(['@getFoo', '@getFoo']).then(() => {
            // should not re-snapshot after the response
            expect(xhrs[0].get('snapshots').length).to.eq(2)
          })
        })

        it('can access requestHeaders', () => {
          cy
          .server()
          .route(/foo/, {}).as('getFoo')
          .window().then((win) => {
            win.$.ajax({
              method: 'GET',
              url: '/foo',
              headers: {
                'x-token': '123',
              },
            })

            return null
          })
          .wait('@getFoo').its('requestHeaders').should('have.property', 'x-token', '123')
        })
      })

      context('responses', () => {
        beforeEach(() => {
          cy
          .server()
          .route(/foo/, {}).as('getFoo')
          .window().then((win) => {
            win.$.get('foo_bar')

            return null
          })
          .wait('@getFoo')
        })

        it('logs obj', function () {
          const obj = {
            name: 'xhr',
            displayName: 'xhr stub',
            event: true,
            message: '',
            type: 'parent',
            aliasType: 'route',
            referencesAlias: undefined,
            alias: 'getFoo',
          }

          const { lastLog } = this

          _.each(obj, (value, key) => {
            expect(lastLog.get(key)).to.deep.eq(value, `expected key: ${key} to eq value: ${value}`)
          })
        })

        it('ends', function () {
          const { lastLog } = this

          expect(lastLog.get('state')).to.eq('passed')
        })

        it('snapshots again', function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[0].name).to.eq('request')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')
          expect(lastLog.get('snapshots')[1].name).to.eq('response')
          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 200,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'xhr') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('sets err on log when caused by code errors', function (done) {
        const uncaughtException = cy.stub().returns(true)

        cy.on('uncaught:exception', uncaughtException)

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('name')).to.eq('xhr')
          expect(lastLog.get('error').message).contain('foo is not defined')
          // since this is AUT code, we should allow error to be caught in 'uncaught:exception' hook
          // https://github.com/cypress-io/cypress/issues/987
          expect(uncaughtException).calledOnce

          done()
        })

        cy.window().then((win) => {
          return new Promise(() => {
            win.$.get('http://www.google.com/foo.json')
            .fail(() => {
              foo.bar() // eslint-disable-line no-undef
            })
          })
        })
      })

      it('causes errors caused by onreadystatechange callback function', function (done) {
        const e = new Error('onreadystatechange caused this error')

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('name')).to.eq('xhr')
          expect(err).to.eq(lastLog.get('error'))
          expect(err).to.eq(e)

          done()
        })

        cy
        .window().then((win) => {
          return new Promise((resolve) => {
            const xhr = new win.XMLHttpRequest

            xhr.open('GET', '/foo')
            xhr.onreadystatechange = function () {
              throw e
            }

            xhr.send()
          })
        })
      })
    })
  })

  context('#server', () => {
    it('logs deprecation warning', () => {
      cy.stub(Cypress.utils, 'warning')

      cy.server()
      .then(function () {
        expect(Cypress.utils.warning).to.be.calledWithMatch(/^`cy\.server\(\)` has been deprecated and will be moved to a plugin in a future release\. Consider migrating to using `cy\.intercept\(\)` instead\./)
      })
    })

    it('sets serverIsStubbed', () => {
      cy.server().then(() => {
        expect(cy.state('serverIsStubbed')).to.be.true
      })
    })

    it('can disable serverIsStubbed', () => {
      cy.server({ enable: false }).then(() => {
        expect(cy.state('serverIsStubbed')).to.be.false
      })
    })

    it('sends enable to server', () => {
      const set = cy.spy(cy.state('server'), 'set')

      cy.server().then(() => {
        expect(set).to.be.calledWithExactly({ enable: true })
      })
    })

    it('can disable the server after enabling it', () => {
      const set = cy.spy(cy.state('server'), 'set')

      cy
      .server()
      .route(/app/, {}).as('getJSON')
      .window().then((win) => {
        win.$.get('/fixtures/app.json')

        return null
      })
      .wait('@getJSON').its('responseBody').should('deep.eq', {})
      .server({ enable: false })
      .then(() => {
        expect(set).to.be.calledWithExactly({ enable: false })
      })
      .window().then((win) => {
        win.$.get('/fixtures/app.json')

        return null
      })
      .wait('@getJSON').its('responseBody').should('not.deep.eq', {})
    })

    it('sets delay at 0 by default', () => {
      cy
      .server()
      .route('*', {})
      .then(() => {
        expect(cy.state('server').getRoutes()[0].delay).to.eq(0)
      })
    })

    it('sets ignore as function by default', () => {
      cy.server()
      cy.route('*', {})
      .then(() => {
        expect(cy.state('server').getRoutes()[0].ignore).to.be.a('function')
      })
    })

    it('passes down options.delay to routes', () => {
      cy
      .server({ delay: 100 })
      .route('*', {})
      .then(() => {
        expect(cy.state('server').getRoutes()[0].delay).to.eq(100)
      })
    })

    it('passes event argument to xhr.onreadystatechange', (done) => {
      cy.window().then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.onreadystatechange = function (e) {
          expect(e).to.be.an.instanceof(win.Event)

          done()
        }

        xhr.open('GET', 'http://localhost:3500/')
      })
    })

    describe('errors', () => {
      context('argument signature', () => {
        _.each(['asdf', 123, null, undefined], (arg) => {
          it(`throws on bad argument: ${arg}`, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.include('`cy.server()` accepts only an object literal as its argument')
              expect(err.docsUrl).to.eq('https://on.cypress.io/server')

              done()
            })

            cy.server(arg)
          })
        })
      })

      it('after turning off server it throws attempting to route', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.route()` cannot be invoked before starting the `cy.server()`')
          expect(err.docsUrl).to.eq('https://on.cypress.io/server')

          done()
        })

        cy.server()
        cy.route(/app/, {})
        cy.server({ enable: false })

        cy.route(/app/, {})
      })

      describe('.log', () => {
        beforeEach(function () {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'xhr') {
              this.lastLog = log
              this.logs.push(log)
            }
          })

          return null
        })

        it('provides specific #onFail', function (done) {
          cy.on('fail', (err) => {
            const obj = {
              name: 'xhr',
              referencesAlias: undefined,
              alias: 'getFoo',
              aliasType: 'route',
              type: 'parent',
              error: err,
              instrument: 'command',
              message: '',
              event: true,
            }

            const { lastLog } = this

            _.each(obj, (value, key) => {
              expect(value).deep.eq(lastLog.get(key), `expected key: ${key} to eq value: ${value}`)
            })

            done()
          })

          cy
          .server()
          .route(/foo/, {}).as('getFoo')
          .window().then((win) => {
            return win.$.get('/foo').done(() => {
              throw new Error('specific ajax error')
            })
          })
        })
      })
    })
  })

  context('#route', () => {
    beforeEach(function () {
      this.expectOptionsToBe = (opts) => {
        const options = this.route.getCall(0).args[0]

        _.each(opts, (value, key) => {
          expect(options[key]).to.deep.eq(opts[key], `failed on property: (${key})`)
        })
      }

      cy.server().then(function () {
        this.route = cy.spy(cy.state('server'), 'route')
      })
    })

    it('logs deprecation warning', () => {
      cy.stub(Cypress.utils, 'warning')

      cy.route('*')
      .then(function () {
        expect(Cypress.utils.warning).to.be.calledWithMatch(/^`cy\.route\(\)` has been deprecated and will be moved to a plugin in a future release\. Consider migrating to using `cy\.intercept\(\)` instead\./)
      })
    })

    it('accepts url, response', () => {
      cy.route('/foo', {}).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: '/foo',
          response: {},
        })
      })
    })

    it('accepts regex url, response', () => {
      cy.route(/foo/, {}).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: /foo/,
          response: {},
        })
      })
    })

    it('does not mutate other routes when using shorthand', () => {
      cy
      .route('POST', /foo/, {}).as('getFoo')
      .route(/bar/, {}).as('getBar')
      .then(function () {
        expect(this.route.firstCall.args[0].method).to.eq('POST')
        expect(this.route.secondCall.args[0].method).to.eq('GET')
      })
    })

    it('accepts url, response, onRequest', () => {
      const onRequest = () => {}

      cy.route({
        url: '/foo',
        response: {},
        onRequest,
      }).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: '/foo',
          response: {},
          onRequest,
          onResponse: undefined,
        })
      })
    })

    it('accepts url, response, onRequest, onResponse', () => {
      const onRequest = () => {}
      const onResponse = () => {}

      cy.route({
        url: '/foo',
        response: {},
        onRequest,
        onResponse,
      }).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: '/foo',
          response: {},
          onRequest,
          onResponse,
        })
      })
    })

    it('accepts method, url, response', () => {
      cy.route('GET', '/foo', {}).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: '/foo',
          response: {},
        })
      })
    })

    it('accepts method, url, response, onRequest', () => {
      const onRequest = () => {}

      cy.route({
        method: 'GET',
        url: '/foo',
        response: {},
        onRequest,
      }).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          url: '/foo',
          status: 200,
          response: {},
          onRequest,
          onResponse: undefined,
        })
      })
    })

    it('accepts method, url, response, onRequest, onResponse', () => {
      const onRequest = () => {}
      const onResponse = () => {}

      cy.route({
        method: 'GET',
        url: '/foo',
        response: {},
        onRequest,
        onResponse,
      }).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          url: '/foo',
          status: 200,
          response: {},
          onRequest,
          onResponse,
        })
      })
    })

    it('uppercases method', () => {
      cy.route('get', '/foo', {}).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: '/foo',
          response: {},
        })
      })
    })

    it('accepts string or regex as the url', () => {
      cy.route('get', /.*/, {}).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: /.*/,
          response: {},
        })
      })
    })

    it('does not require response or method when not stubbing', () => {
      cy
      .server()
      .route(/users/).as('getUsers')
      .then(function () {
        this.expectOptionsToBe({
          status: 200,
          method: 'GET',
          url: /users/,
        })
      })
    })

    it('does not require response when not stubbing', () => {
      cy
      .server()
      .route('POST', /users/).as('createUsers')
      .then(function () {
        this.expectOptionsToBe({
          status: 200,
          method: 'POST',
          url: /users/,
        })
      })
    })

    it('accepts an object literal as options', () => {
      const onRequest = () => {}
      const onResponse = () => {}

      const opts = {
        method: 'PUT',
        url: '/foo',
        status: 200,
        response: {},
        onRequest,
        onResponse,
      }

      cy.route(opts).then(function () {
        this.expectOptionsToBe(opts)
      })
    })

    it('can accept wildcard * as URL and converts to /.*/ regex', () => {
      const opts = {
        url: '*',
        response: {},
      }

      cy.route(opts).then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: /.*/,
          originalUrl: '*',
          response: {},
        })
      })
    })

    // FIXME: I have no idea why this is skipped, this test is rly old
    it.skip('can explicitly done() in onRequest function from options', (done) => {
      cy
      .server()
      .route({
        method: 'POST',
        url: '/users',
        response: {},
        onRequest () {
          done()
        },
      })
      .then(() => {
        cy.state('window').$.post('/users', 'name=brian')
      })
    })

    it('can accept response as a function', () => {
      const users = [{}, {}]
      const getUsers = () => {
        return users
      }

      cy.route(/users/, getUsers)
      .then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: /users/,
          response: users,
        })
      })
    })

    it('invokes response function with runnable.ctx', function () {
      const ctx = this

      const getUsers = function () {
        expect(this === ctx).to.be.true
      }

      cy.route(/users/, getUsers)
    })

    it('passes options as argument', function () {
      const getUsers = function (opts) {
        expect(opts).to.be.an('object')
        expect(opts.method).to.eq('GET')
      }

      cy.route(/users/, getUsers)
    })

    it('can accept response as a function which returns a promise', () => {
      const users = [{}, {}]

      const getUsers = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(users)
          }, 10)
        })
      }

      cy.route(/users/, getUsers)
      .then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 200,
          url: /users/,
          response: users,
        })
      })
    })

    it('can accept a function which returns options', () => {
      const users = [{}, {}]

      const getRoute = () => {
        return {
          method: 'GET',
          url: /users/,
          status: 201,
          response () {
            return Promise.resolve(users)
          },
        }
      }

      cy.route(getRoute)
      .then(function () {
        this.expectOptionsToBe({
          method: 'GET',
          status: 201,
          url: /users/,
          response: users,
        })
      })
    })

    it('invokes route function with runnable.ctx', function () {
      const ctx = this

      const getUsers = function () {
        expect(this === ctx).to.be.true

        return {
          url: /foo/,
        }
      }

      cy.route(getUsers)
    })

    // FIXME: I have no idea why this is skipped, this test is rly old
    it.skip('adds multiple routes to the responses array', () => {
      cy
      .route('foo', {})
      .route('bar', {})
      .then(() => {
        expect(cy.state('sandbox').server.responses).to.have.length(2)
      })
    })

    it('can use regular strings as response', () => {
      cy
      .route('/foo', 'foo bar baz').as('getFoo')
      .window().then((win) => {
        win.$.get('/foo')

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(xhr.responseBody).to.eq('foo bar baz')
      })
    })

    it('can stub requests with uncommon HTTP methods', () => {
      cy
      .route('PROPFIND', '/foo', 'foo bar baz').as('getFoo')
      .window().then((win) => {
        win.$.ajax({
          url: '/foo',
          method: 'PROPFIND',
        })

        return null
      })
      .wait('@getFoo').then((xhr) => {
        expect(xhr.responseBody).to.eq('foo bar baz')
      })
    })

    // https://github.com/cypress-io/cypress/issues/2372
    it('warns if a percent-encoded URL is used', () => {
      cy.spy(Cypress.utils, 'warning')

      cy.route('GET', '/foo%25bar')
      .then(() => {
        expect(Cypress.utils.warning).to.be.calledWith(stripIndent`\
          A \`url\` with percent-encoded characters was passed to \`cy.route()\`, but \`cy.route()\` expects a decoded \`url\`.

          Did you mean to pass "/foo%bar"?

          https://on.cypress.io/route`)
      })
    })

    it('does not warn if an invalid percent-encoded URL is used', () => {
      cy.spy(Cypress.utils, 'warning')

      cy.route('GET', 'http://example.com/%E0%A4%A')
      .then(() => {
        expect(Cypress.utils.warning).to.not.be.calledWithMatch(/percent\-encoded characters/)
      })
    })

    // FIXME: I have no idea why this is skipped, this test is rly old
    it.skip('does not error when response is null but respond is false', () => {
      cy.route({
        url: /foo/,
        respond: false,
      })
    })

    describe('request response alias', () => {
      it('matches xhrs with lowercase methods', () => {
        cy
        .route(/foo/, {}).as('getFoo')
        .window().then((win) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('get', '/foo')
          xhr.send()
        }).wait('@getFoo')
      })

      it('can pass an alias reference to route', () => {
        cy
        .noop({ foo: 'bar' }).as('foo')
        .route(/foo/, '@foo').as('getFoo')
        .window().then((win) => {
          win.$.getJSON('foo')

          return null
        })
        .wait('@getFoo').then(function (xhr) {
          expect(xhr.responseBody).to.deep.eq({ foo: 'bar' })
          expect(xhr.responseBody).to.deep.eq(this.foo)
        })
      })

      it('can pass an alias when using a response function', () => {
        const getFoo = () => {
          return Promise.resolve('@foo')
        }

        cy
        .noop({ foo: 'bar' }).as('foo')
        .route(/foo/, getFoo).as('getFoo')
        .window().then((win) => {
          win.$.getJSON('foo')

          return null
        })
        .wait('@getFoo').then(function (xhr) {
          expect(xhr.responseBody).to.deep.eq({ foo: 'bar' })
          expect(xhr.responseBody).to.deep.eq(this.foo)
        })
      })

      it('can alias a route without stubbing it', () => {
        cy
        .route(/fixtures\/app/).as('getFoo')
        .window().then((win) => {
          win.$.get('/fixtures/app.json')

          return null
        })
        .wait('@getFoo').then((xhr) => {
          const log = cy.queue.logs({ name: 'xhr' })[0]

          expect(log.get('displayName')).to.eq('xhr')
          expect(log.get('alias')).to.eq('getFoo')
          expect(xhr.responseBody).to.deep.eq({
            some: 'json',
            foo: {
              bar: 'baz',
            },
          })
        })
      })
    })

    describe('response fixtures', () => {
      it('works if the JSON file has an object', () => {
        cy
        .server()
        .route({
          method: 'POST',
          url: '/test-xhr',
          response: 'fixture:valid.json',
        })
        .visit('/fixtures/xhr-triggered.html')
        .get('#trigger-xhr')
        .click()

        cy.contains('#result', '{"foo":1,"bar":{"baz":"cypress"}}').should('be.visible')
      })

      it('works if the JSON file has null content', () => {
        cy
        .server()
        .route({
          method: 'POST',
          url: '/test-xhr',
          response: 'fixture:null.json',
        })
        .visit('/fixtures/xhr-triggered.html')
        .get('#trigger-xhr')
        .click()

        cy.contains('#result', '""').should('be.visible')
      })

      it('works if the JSON file has number content', () => {
        cy
        .server()
        .route({
          method: 'POST',
          url: '/test-xhr',
          response: 'fixture:number.json',
        })
        .visit('/fixtures/xhr-triggered.html')
        .get('#trigger-xhr')
        .click()

        cy.contains('#result', 14).should('be.visible')
      })

      it('works if the JSON file has boolean content', () => {
        cy
        .server()
        .route({
          method: 'POST',
          url: '/test-xhr',
          response: 'fixture:boolean.json',
        })
        .visit('/fixtures/xhr-triggered.html')
        .get('#trigger-xhr')
        .click()

        cy.contains('#result', /true/).should('be.visible')
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('throws if cy.server() hasnt been invoked', (done) => {
        cy.state('serverIsStubbed', false)

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` cannot be invoked before starting the `cy.server()`')

          done()
        })

        cy.route()
      })

      it('throws on use of whitelist option', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('The `cy.server()` `whitelist` option has been renamed to `ignore`. Please rename `whitelist` to `ignore`.')

          done()
        })

        cy.server({ whitelist: () => { } })
      })

      it('url must be a string or regexp', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` was called with an invalid `url`. `url` must be either a string or regular expression.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/route')

          done()
        })

        cy.route({
          url: {},
        })
      })

      it('url must be a string or regexp when a function', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` was called with an invalid `url`. `url` must be either a string or regular expression.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/route')

          done()
        })

        const getUrl = () => {
          return Promise.resolve({ url: {} })
        }

        cy.route(getUrl)
      })

      it('fails when functions reject', (done) => {
        const error = new Error

        cy.on('fail', (err) => {
          expect(err).to.eq(error)

          done()
        })

        const getUrl = () => {
          return Promise.reject(error)
        }

        cy.route(getUrl)
      })

      it('fails when method is invalid', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` was called with an invalid method: `POSTS`.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/route')

          done()
        })

        cy.route('posts', '/foo', {})
      })

      it('requires a url when given a response', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` must be called with a `url`. It can be a string or regular expression.')

          done()
        })

        cy.route({})
      })

      _.each([null, undefined], (val) => {
        it(`throws if response options was explicitly set to ${val}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.route()` cannot accept an `undefined` or `null` response. It must be set to something, even an empty string will work.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/route')

            done()
          })

          cy.route({ url: /foo/, response: val })
        })

        it(`throws if response argument was explicitly set to ${val}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.route()` cannot accept an `undefined` or `null` response. It must be set to something, even an empty string will work.')

            done()
          })

          cy.route(/foo/, val)
        })
      })

      it('requires arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.route()` was not provided any arguments. You must provide valid arguments.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/route')

          done()
        })

        cy.route()
      })

      it('sets err on log when caused by the XHR response', function (done) {
        // NOTE: sometimes the .then command will timeout before the request finishes
        // so bump the timeout here. This does not increase test duration
        Cypress.config('defaultCommandTimeout', 1000)
        this.route.restore()

        cy.on('fail', (err) => {
          const { lastLog } = this

          // route + window + xhr log === 3
          expect(this.logs.length).to.eq(3)
          expect(lastLog.get('name')).to.eq('xhr')
          expect(err).to.eq(lastLog.get('error'))

          done()
        })

        cy
        .route(/foo/, {}).as('getFoo')
        .window().then((win) => {
          return win.$.get('foo_bar').done(() => {
            foo.bar() // eslint-disable-line no-undef
          })
        })
      })

      // FIXME: I have no idea why this is skipped, this test is rly old
      it.skip('explodes if response fixture signature errors', function (done) {
        this.trigger = cy.stub(this.Cypress, 'trigger').withArgs('fixture').callsArgWithAsync(2, { __error: 'some error' })

        const logs = []

        const _this = this

        // we have to restore the trigger when commandErr is called
        // so that something logs out!
        cy.commandErr = _.wrap(cy.commandErr, function (orig, err) {
          _this.Cypress.trigger.restore()
          orig.call(this, err)
        })

        cy.on('log:added', (attrs, log) => {
          this.log = log
          logs.push(this.log)
        })

        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.eq('some error')
          expect(this.logs.length).to.eq(1)
          expect(lastLog.get('name')).to.eq('route')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('message')).to.eq('/foo/, fixture:bar')

          done()
        })

        cy.route(/foo/, 'fixture:bar')
      })

      // TODO: handle this uncaught exception failure
      it.skip('does not retry (cancels existing promise) when xhr errors', (done) => {
        const cancel = cy.spy(Promise.prototype, 'cancel')

        cy.on('command:retry', () => {
          if (cy.state('error')) {
            done('should have canceled and not retried after failing')
          }
        })

        cy.on('fail', (err) => {
          const p = cy.state('promise')

          _.delay(() => {
            expect(cancel).to.be.calledOn(p)

            done()
          }, 100)
        })

        cy
        .route({
          url: /foo/,
          response: {},
          delay: 100,
        })
        .window().then((win) => {
          win.$.getJSON('/foo').done(() => {
            throw new Error('foo failed')
          })

          return null
        })
        .get('button').should('have.class', 'does-not-exist')
      })

      it('explodes if response alias cannot be found', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('`cy.route()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.')
          expect(lastLog.get('name')).to.eq('route')
          expect(lastLog.get('error')).to.eq(err)
          expect(lastLog.get('message')).to.eq('/foo/, @bar')

          done()
        })

        cy
        .wrap({ foo: 'bar' }).as('foo')
        .route(/foo/, '@bar')
      })

      // https://github.com/cypress-io/cypress/issues/7818
      it('throws when fixture cannot be found', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.contains('A fixture file could not be found at any of the following paths:')
          done()
        })

        cy.route(/foo/, 'fx:NOT_EXISTING_FILE_FIXTURE').as('stub')
        cy.window().then((win) => {
          win.$.get('/foo')
        })

        cy.wait('@stub')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.instrument === 'route') {
            this.lastLog = log
            this.logs.push(log)
          }
        })

        return null
      })

      it('has name of route', () => {
        cy.route('/foo', {}).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('route')
        })
      })

      it('uses the wildcard URL', () => {
        cy.route('*', {}).then(function () {
          const { lastLog } = this

          expect(lastLog.get('url')).to.eq('*')
        })
      })

      it('#consoleProps', () => {
        cy.route('*', { foo: 'bar' }).as('foo').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'route',
            Method: 'GET',
            URL: '*',
            Status: 200,
            Response: { foo: 'bar' },
            Alias: 'foo',
            // Responded: 1 time
            // "-------": ""
            // Responses: []
          })
        })
      })

      describe('numResponses', () => {
        it('is initially 0', function () {
          cy.route(/foo/, {}).then(() => {
            const { lastLog } = this

            expect(lastLog.get('numResponses')).to.eq(0)
          })
        })

        it('is incremented to 2', () => {
          cy
          .route(/foo/, {})
          .window().then((win) => {
            return win.$.get('/foo')
          })
          .then(function () {
            expect(this.lastLog.get('numResponses')).to.eq(1)
          })
        })

        it('is incremented for each matching request', () => {
          cy
          .route(/foo/, {})
          .window().then((win) => {
            return Promise.all([
              win.$.get('/foo'),
              win.$.get('/foo'),
              win.$.get('/foo'),
            ])
          })
          .then(function () {
            expect(this.lastLog.get('numResponses')).to.eq(3)
          })
        })
      })
    })
  })

  context('consoleProps logs', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'xhr') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    describe('when stubbed', () => {
      it('says Stubbed: Yes', () => {
        cy
        .server()
        .route(/foo/, {}).as('getFoo')
        .window().then((win) => {
          return new Promise((resolve) => {
            return win.$.get('/foo').done(resolve)
          })
        })
        .then(function () {
          expect(this.lastLog.invoke('consoleProps').Stubbed).to.eq('Yes')
        })
      })
    })

    describe('zero configuration / zero routes', () => {
      beforeEach(() => {
        cy
        .server({ force404: true })
        .window().then((win) => {
          return new Promise((resolve) => {
            win.$.ajax({
              method: 'POST',
              url: '/foo',
              data: JSON.stringify({ foo: 'bar' }),
            }).fail(() => {
              resolve()
            })
          })
        })
      })

      it('calculates duration', () => {
        cy.then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.Duration).to.be.a('number')
          expect(consoleProps.Duration).to.be.gt(1)
          expect(consoleProps.Duration).to.be.lt(1000)
        })
      })

      it('sends back regular 404', () => {
        cy.then(function () {
          const { xhr } = cy.state('responses')[0]

          const consoleProps = _.pick(this.lastLog.invoke('consoleProps'), 'Method', 'Status', 'URL', 'XHR')

          expect(consoleProps).to.deep.eq({
            Method: 'POST',
            Status: '404 (Not Found)',
            URL: 'http://localhost:3500/foo',
            XHR: xhr.xhr,
          })
        })
      })

      it('says Stubbed: Yes when sent 404 back', function () {
        expect(this.lastLog.invoke('consoleProps').Stubbed).to.eq('Yes')
      })
    })

    describe('ignored routes', () => {
      it('does not send back 404s on allowed routes', () => {
        cy
        .server()
        .window().then((win) => {
          return win.$.get('/fixtures/app.js')
        })
        .then((resp) => {
          expect(resp).to.eq('{ \'bar\' }\n')
        })
      })

      // https://github.com/cypress-io/cypress/issues/7280
      it('ignores query params when filtering routes', () => {
        cy.server()
        cy.route(/url-with-query-param/, { foo: 'bar' }).as('getQueryParam')
        cy.window().then((win) => {
          win.$.get('/url-with-query-param?resource=foo.js')

          return null
        })

        cy.wait('@getQueryParam').its('response.body')
        .should('deep.equal', { foo: 'bar' })
      })

      // https://github.com/cypress-io/cypress/issues/7280
      it('ignores hashes when filtering routes', () => {
        cy.server()
        cy.route(/url-with-hash/, { foo: 'bar' }).as('getHash')
        cy.window().then((win) => {
          win.$.get('/url-with-hash#foo.js')

          return null
        })

        cy.wait('@getHash').its('response.body')
        .should('deep.equal', { foo: 'bar' })
      })

      it('overrides ignoring resources when passed as option', () => {
        cy.server({ ignore: () => false })
        cy.route('app.js', { foo: 'bar' }).as('getJSResource')
        cy.route('index.html', '<html></html>').as('getHTMLResource')
        cy.route('style.css', 'body: {color: red;}').as('getCSSResource')
        cy.window().then((win) => {
          win.$.get('/fixtures/app.js')
          win.$.get('/fixtures/style.css')

          return win.$.get('/fixtures/index.html')
        })

        // normally these resources would be ignored
        // but overwriting ignore to return false allows all resources
        cy.wait('@getJSResource').its('response.body')
        .should('deep.equal', { foo: 'bar' })

        cy.wait('@getHTMLResource').its('response.body')
        .should('deep.equal', '<html></html>')

        cy.wait('@getCSSResource').its('response.body')
        .should('deep.equal', 'body: {color: red;}')
      })
    })

    describe('route setup', () => {
      beforeEach(() => {
        cy
        .server({ force404: true })
        .route('/foo', {}).as('anyRequest')
        .window().then((win) => {
          win.$.get('/bar')

          return null
        })
      })

      it('sends back 404 when request doesnt match route', () => {
        cy.then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.Note).to.eq('This request did not match any of your routes. It was automatically sent back \'404\'. Setting cy.server({force404: false}) will turn off this behavior.')
        })
      })
    })

    describe('{force404: false}', () => {
      beforeEach(() => {
        cy
        .server()
        .window().then((win) => {
          return win.$.getJSON('/fixtures/app.json')
        })
      })

      it('says Stubbed: No when request isnt forced 404', function () {
        expect(this.lastLog.invoke('consoleProps').Stubbed).to.eq('No')
      })

      it('logs request + response headers', () => {
        cy.then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.Request.headers).to.be.an('object')
          expect(consoleProps.Response.headers).to.be.an('object')
        })
      })

      it('logs Method, Status, URL, and XHR', () => {
        cy.then(function () {
          const { xhr } = cy.state('responses')[0]

          const consoleProps = _.pick(this.lastLog.invoke('consoleProps'), 'Method', 'Status', 'URL', 'XHR')

          expect(consoleProps).to.deep.eq({
            Method: 'GET',
            URL: 'http://localhost:3500/fixtures/app.json',
            Status: '200 (OK)',
            XHR: xhr.xhr,
          })
        })
      })

      it('logs response', () => {
        cy.then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.Response.body).to.deep.eq({
            some: 'json',
            foo: {
              bar: 'baz',
            },
          })
        })
      })

      it('sets groups Initiator', () => {
        cy.then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          const group = consoleProps.groups()[0]

          expect(group.name).to.eq('Initiator')
          expect(group.label).to.be.false
          expect(group.items[0]).to.be.a('string')
          expect(group.items[0].split('\n').length).to.gt(1)
        })
      })
    })
  })

  context('renderProps', () => {
    beforeEach(function () {
      this.logs = []

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'xhr') {
          this.lastLog = log
          this.logs.push(log)
        }
      })

      return null
    })

    describe('in any case', () => {
      beforeEach(() => {
        cy
        .server()
        .route(/foo/, {})
        .window().then((win) => {
          return new Promise((resolve) => {
            return win.$.get('/foo').done(resolve)
          })
        })
      })

      it('sends correct message', () => {
        cy.then(function () {
          expect(this.lastLog.invoke('renderProps').message).to.equal('GET 200 /foo')
        })
      })
    })

    describe('when response is successful', () => {
      beforeEach(() => {
        cy
        .server()
        .route(/foo/, {})
        .window().then((win) => {
          return new Promise((resolve) => {
            return win.$.get('/foo').done(resolve)
          })
        })
      })

      it('sends correct indicator', () => {
        cy.then(function () {
          expect(this.lastLog.invoke('renderProps').indicator).to.equal('successful')
        })
      })
    })

    describe('when response is pending', () => {
      beforeEach(() => {
        cy
        .server()
        .route({ url: '/foo', delay: 500, response: {} })
        .window().then((win) => {
          win.$.get('/foo')

          return null
        })
      })

      // FAILING
      it('sends correct message', function () {
        expect(this.lastLog.invoke('renderProps').message).to.equal('GET --- /foo')
      })

      it('sends correct indicator', function () {
        expect(this.lastLog.invoke('renderProps').indicator).to.equal('pending')
      })
    })

    describe('when response is outside 200 range', () => {
      beforeEach(() => {
        cy
        .server()
        .route({ url: '/foo', status: 500, response: {} })
        .window().then((win) => {
          return new Promise((resolve) => {
            return win.$.get('/foo').fail(() => {
              resolve()
            })
          })
        })
      })

      it('sends correct indicator', () => {
        cy.then(function () {
          expect(this.lastLog.invoke('renderProps').indicator).to.equal('bad')
        })
      })
    })
  })

  context('abort', () => {
    const xhrs = []

    beforeEach(() => {
      cy.visit('/fixtures/jquery.html')
    })

    it('does not abort xhr\'s between tests', () => {
      cy.window().then((win) => {
        _.times(2, () => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/timeout?ms=100')
          xhr.send()
          xhrs.push(xhr)
        })
      })
    })

    it('has not aborted the xhrs', () => {
      _.each(xhrs, (xhr) => {
        expect(xhr.aborted).not.to.be.false
      })
    })

    it('aborts xhrs that haven\'t been sent', () => {
      cy
      .window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/timeout?ms=0')
        xhr.abort()

        expect(xhr.aborted).to.be.true
      })
    })

    it('aborts xhrs currently in flight', () => {
      let log = null

      cy.on('log:changed', (attrs, l) => {
        if (attrs.name === 'xhr') {
          if (!log) {
            log = l
          }
        }
      })

      cy
      .window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.open('GET', '/timeout?ms=999')
        xhr.send()
        xhr.abort()

        cy.wrap(null).should(() => {
          expect(log.get('state')).to.eq('failed')
          expect(log.invoke('renderProps')).to.deep.eq({
            message: 'GET (aborted) /timeout?ms=999',
            indicator: 'aborted',
          })

          expect(xhr.aborted).to.be.true
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/3008
    it('aborts xhrs even when responseType  not \'\' or \'text\'', () => {
      let log = null

      cy.on('log:changed', (attrs, l) => {
        if (attrs.name === 'xhr') {
          if (!log) {
            log = l
          }
        }
      })

      cy
      .window()
      .then((win) => {
        const xhr = new win.XMLHttpRequest()

        xhr.responseType = 'arraybuffer'
        xhr.open('GET', '/timeout?ms=1000')
        xhr.send()
        xhr.abort()

        cy.wrap(null).should(() => {
          expect(log.get('state')).to.eq('failed')
          expect(xhr.aborted).to.be.true
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/1652
    it('does not set aborted on XHR\'s that have completed by have had .abort() called', () => {
      let log = null

      cy.on('log:changed', (attrs, l) => {
        if (attrs.name === 'xhr') {
          if (!log) {
            log = l
          }
        }
      })

      cy
      .window()
      .then((win) => {
        return new Promise((resolve) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('GET', '/timeout?ms=0')
          xhr.onload = function () {
            xhr.abort()
            xhr.foo = 'bar'

            return resolve(xhr)
          }

          xhr.send()
        })
      })
      .then((xhr) => {
        cy
        .wrap(null)
        .should(() => {
          // ensure this is set to prevent accidental
          // race conditions down the road if something
          // goes wrong
          expect(xhr.foo).to.eq('bar')
          expect(xhr.aborted).not.to.be.true
          expect(log.get('state')).to.eq('passed')
        })
      })
    })
  })

  context('Cypress.on(window:unload)', () => {
    it('cancels all open XHR\'s', () => {
      const xhrs = []

      cy
      .window()
      .then((win) => {
        _.times(2, () => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/timeout?ms=200')
          xhr.send()
          xhrs.push(xhr)
        })
      })
      .reload()
      .then(() => {
        _.each(xhrs, (xhr) => {
          expect(xhr.canceled).to.be.true
        })
      })
    })
  })

  context('Cypress.on(window:before:load)', () => {
    it('reapplies server + route automatically before window:load', () => {
      // this tests that the server + routes are automatically reapplied
      // after the 2nd visit - which is an example of the remote iframe
      // causing an onBeforeLoad event
      cy
      .server()
      .route(/foo/, { foo: 'bar' }).as('getFoo')
      .visit('http://localhost:3500/fixtures/jquery.html')
      .window().then((win) => {
        return new Promise((resolve) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/foo')
          xhr.send()
          xhr.onload = resolve
        })
      })
      .wait('@getFoo').its('url').should('include', '/foo')
      .visit('http://localhost:3500/fixtures/generic.html')
      .window().then((win) => {
        return new Promise((resolve) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/foo')
          xhr.send()
          xhr.onload = resolve
        })
      })
      .wait('@getFoo').its('url').should('include', '/foo')
    })

    it('reapplies server + route automatically during page transitions', () => {
      // this tests that the server + routes are automatically reapplied
      // after the 2nd visit - which is an example of the remote iframe
      // causing an onBeforeLoad event
      cy
      .server()
      .route(/foo/, { foo: 'bar' }).as('getFoo')
      .visit('http://localhost:3500/fixtures/jquery.html')
      .window().then((win) => {
        const url = 'http://localhost:3500/fixtures/generic.html'

        const $a = win.$(`<a href='${url}'>jquery</a>`)
        .appendTo(win.document.body)

        // synchronous beforeunload
        return $a.get(0).click()
      })
      .url().should('include', '/generic.html')
      .window().then((win) => {
        return new Promise((resolve) => {
          const xhr = new win.XMLHttpRequest

          xhr.open('GET', '/foo')
          xhr.send()
          xhr.onload = resolve
        })
      })
      .wait('@getFoo').its('url').should('include', '/foo')
    })
  })

  // FIXME: I have no idea why this is skipped, this test is rly old
  context.skip('#cancel', () => {
    it('calls server#cancel', function (done) {
      let cancel = null

      this.Cypress.once('abort', () => {
        expect(cancel).to.be.called

        done()
      })

      cy.server().then(function () {
        cancel = cy.spy(cy.state('server'), 'cancel')

        this.Cypress.trigger('abort')
      })
    })
  })

  // FIXME: I have no idea why this is skipped, this test is rly old
  context.skip('#respond', () => {
    it('calls server#respond', () => {
      let respond = null

      cy
      .server({ delay: 100 }).then((server) => {
        respond = cy.spy(server, 'respond')
      })
      .window().then((win) => {
        win.$.get('/users')

        return null
      })
      .respond().then(() => {
        expect(respond).to.be.calledOnce
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        this.allowErrors()
      })

      it('errors without a server', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('cy.respond() cannot be invoked before starting the `cy.server()`')

          done()
        })

        cy.respond()
      })

      it('errors with no pending requests', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('cy.respond() did not find any pending requests to respond to')

          done()
        })

        cy
        .server()
        .route(/users/, {})
        .window().then((win) => {
          // this is waited on to be resolved
          // because of jquery promise thenable
          return win.$.get('/users')
        })
        .respond()
      })
    })
  })

  context('options immutability', () => {
    it('does not mutate options for cy.server()', () => {
      const options = { enable: false }

      cy
      .server(options)
      .window().then(() => {
        expect(options).to.deep.eq({ enable: false })
      })
    })

    it('does not mutate options for cy.route()', () => {
      const options = {
        url: /foo/,
        respond: false,
      }

      cy
      .server()
      .route(options)
      .window().then(() => {
        expect(options).to.deep.eq({
          url: /foo/,
          respond: false,
        })
      })
    })
  })
})
