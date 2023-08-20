import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin files', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.fixture()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.fixture('example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  it('.readFile()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.readFile('cypress/fixtures/example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  it('.writeFile()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const contents = JSON.stringify({ foo: 'bar' })

      cy.stub(Cypress, 'backend').log(false).resolves({
        contents,
        filePath: 'foo.json',
      })

      cy.writeFile('foo.json', contents).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'run:privileged',
          {
            args: ['6998637248317671', '4581875909943693'],
            commandName: 'writeFile',
            options: {
              fileName: 'foo.json',
              contents,
              encoding: 'utf8',
              flag: 'w',
            },
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

    it('.readFile()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.readFile('cypress/fixtures/example.json')
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('readFile', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('readFile')
        expect(consoleProps['File Path']).to.include('cypress/fixtures/example.json')
        expect(consoleProps.Contents).to.deep.equal({ example: true })
      })
    })

    it('.writeFile()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const contents = JSON.stringify({ foo: 'bar' })

        cy.stub(Cypress, 'backend').log(false).resolves({
          contents,
          filePath: 'foo.json',
        })

        cy.writeFile('foo.json', contents)
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('writeFile', logs, 'foobar.com')

        expect(consoleProps.Command).to.equal('writeFile')
        expect(consoleProps['File Path']).to.equal('foo.json')
        expect(consoleProps.Contents).to.equal('{"foo":"bar"}')
      })
    })
  })
})
