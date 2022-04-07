import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot files', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  // NOTE: there is no command log for .fixture(). shows up as a (new url)
  it.skip('.fixture()', () => undefined)

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

  // FIXME: this test hangs and needs investigation
  it.skip('.writeFile()', (done) => {
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

    // FIXME: this test hangs when the console is open.
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
