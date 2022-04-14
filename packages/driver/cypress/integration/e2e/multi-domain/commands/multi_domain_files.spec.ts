import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin files', () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.fixture()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.fixture('example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  it('.readFile()', () => {
    cy.origin('http://foobar.com:3500', () => {
      cy.readFile('cypress/fixtures/example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  it('.writeFile()', () => {
    cy.origin('http://foobar.com:3500', () => {
      const contents = JSON.stringify({ foo: 'bar' })

      cy.stub(Cypress, 'backend').resolves({
        contents,
        filePath: 'foo.json',
      })

      cy.writeFile('foo.json', contents).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.json',
          contents,
          {
            encoding: 'utf8',
            flag: 'w',
          },
        )
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

    it('.readFile()', (done) => {
      cy.on('command:queue:end', () => {
        setTimeout(() => {
          const { crossOriginLog, consoleProps } = findCrossOriginLogs('readFile', logs, 'foobar.com')

          expect(crossOriginLog).to.be.true

          expect(consoleProps.Command).to.equal('readFile')
          expect(consoleProps['File Path']).to.include('cypress/fixtures/example.json')
          expect(consoleProps.Contents).to.deep.equal({ example: true })

          done()
        }, 250)
      })

      cy.origin('http://foobar.com:3500', () => {
        cy.readFile('cypress/fixtures/example.json')
      })
    })

    it('.writeFile()', (done) => {
      cy.on('command:queue:end', () => {
        setTimeout(() => {
          const { crossOriginLog, consoleProps } = findCrossOriginLogs('writeFile', logs, 'foobar.com')

          expect(crossOriginLog).to.be.true

          expect(consoleProps.Command).to.equal('writeFile')
          expect(consoleProps['File Path']).to.equal('foo.json')
          expect(consoleProps.Contents).to.equal('{"foo":"bar"}')

          done()
        }, 250)
      })

      cy.origin('http://foobar.com:3500', () => {
        const contents = JSON.stringify({ foo: 'bar' })

        cy.stub(Cypress, 'backend').resolves({
          contents,
          filePath: 'foo.json',
        })

        cy.writeFile('foo.json', contents)
      })
    })
  })
})
