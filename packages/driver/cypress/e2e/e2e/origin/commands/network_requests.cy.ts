import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin network requests', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="request-link"]').click()
  })

  it('.request() to secondary origin', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.request('/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://www.foobar.com:3500/fixtures/example.json')
      })
    })
  })

  it('.request() to secondary origin with relative path', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.request('/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://www.foobar.com:3500/fixtures/example.json')
      })
    })
  })

  it('.request() to primary origin', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.request('http://localhost:3500/fixtures/example.json').should((response) => {
        expect(response.status).to.equal(200)
        expect(response.allRequestResponses[0]['Request URL']).to.equal('http://localhost:3500/fixtures/example.json')
      })
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.request()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.request('/fixtures/example.json')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps, renderProps } = findCrossOriginLogs('request', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('request')
        expect(consoleProps.type).to.equal('command')

        expect(consoleProps.props.Request).to.have.property('Request Body').that.equals(null)
        expect(consoleProps.props.Request).to.have.property('Request Headers').that.is.a('object')
        expect(consoleProps.props.Request).to.have.property('Request URL').that.equals('http://www.foobar.com:3500/fixtures/example.json')
        expect(consoleProps.props.Request).to.have.property('Response Body').that.is.a('string')
        expect(consoleProps.props.Request).to.have.property('Response Headers').that.is.a('object')
        expect(consoleProps.props.Request).to.have.property('Response Status').that.equals(200)

        expect(consoleProps.props.Yielded).to.have.property('body').that.deep.equals({ example: true })
        expect(consoleProps.props.Yielded).to.have.property('duration').that.is.a('number')
        expect(consoleProps.props.Yielded).to.have.property('headers').that.is.a('object')
        expect(consoleProps.props.Yielded).to.have.property('status').that.equals(200)

        expect(renderProps).to.have.property('indicator').that.equals('successful')
        expect(renderProps).to.have.property('message').that.equals('GET 200 /fixtures/example.json')
      })
    })
  })
})
