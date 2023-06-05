import { runImportedPrivilegedCommands } from '../../support/utils'

const isWebkit = Cypress.isBrowser({ family: 'webkit' })

function runSpecFunctionCommands () {
  cy.exec('echo "hello"')
  cy.readFile('cypress/fixtures/app.json')
  cy.writeFile('cypress/_test-output/written.json', 'contents')
  cy.task('return:arg', 'arg')
  cy.get('#basic').selectFile('cypress/fixtures/valid.json')
  if (!isWebkit) {
    cy.origin('http://foobar.com:3500', () => {})
  }
}

Cypress.Commands.add('runSpecFileCustomPrivilegedCommands', runSpecFunctionCommands)

describe('privileged commands', () => {
  describe('in spec file or support file', () => {
    let ranInBeforeEach = false

    beforeEach(() => {
      if (ranInBeforeEach) return

      ranInBeforeEach = true

      // ensures these run properly in hooks, but only run it once per spec run
      cy.exec('echo "hello"')
      cy.readFile('cypress/fixtures/app.json')
      cy.writeFile('cypress/_test-output/written.json', 'contents')
      cy.task('return:arg', 'arg')
      cy.get('#basic').selectFile('cypress/fixtures/valid.json')
      if (!isWebkit) {
        cy.origin('http://foobar.com:3500', () => {})
      }
    })

    it('passes in test body', () => {
      cy.exec('echo "hello"')
      cy.readFile('cypress/fixtures/app.json')
      cy.writeFile('cypress/_test-output/written.json', 'contents')
      cy.task('return:arg', 'arg')
      cy.get('#basic').selectFile('cypress/fixtures/valid.json')
      if (!isWebkit) {
        cy.origin('http://foobar.com:3500', () => {})
      }
    })

    it('passes in test body .then() callback', () => {
      cy.then(() => {
        cy.exec('echo "hello"')
        cy.readFile('cypress/fixtures/app.json')
        cy.writeFile('cypress/_test-output/written.json', 'contents')
        cy.task('return:arg', 'arg')
        cy.get('#basic').selectFile('cypress/fixtures/valid.json')
        if (!isWebkit) {
          cy.origin('http://foobar.com:3500', () => {})
        }
      })
    })

    it('passes in spec function', () => {
      runSpecFunctionCommands()
    })

    it('passes in imported function', () => {
      runImportedPrivilegedCommands()
    })

    it('passes in support file global function', () => {
      window.runGlobalPrivilegedCommands()
    })

    it('passes in spec file custom command', () => {
      cy.runSpecFileCustomPrivilegedCommands()
    })

    it('passes in support file custom command', () => {
      cy.runSupportFileCustomPrivilegedCommands()
    })

    // cy.origin() doesn't currently have webkit support
    it('passes in .origin() callback', { browser: '!webkit' }, () => {
      cy.origin('http://foobar.com:3500', () => {
        // cy.exec('echo "hello"')
        // cy.readFile('cypress/fixtures/app.json')
        // cy.writeFile('cypress/_test-output/written.json', 'contents')
        cy.task('return:arg', 'arg')

        // there's a bug using cy.selectFile() with a path inside of
        // cy.origin(): https://github.com/cypress-io/cypress/issues/25261
        // cy.visit('/fixtures/files-form.html')
        // cy.get('#basic').selectFile('cypress/fixtures/valid.json')
      })
    })
  })

  describe('in AUT', () => {
    const strategies = ['inline', 'then', 'eval', 'function']
    const commands = ['exec', 'readFile', 'writeFile', 'selectFile', 'task']

    // cy.origin() doesn't currently have webkit support
    if (!Cypress.isBrowser({ family: 'webkit' })) {
      commands.push('origin')
    }

    const errorForCommand = (commandName) => {
      return `\`cy.${commandName}()\` must only be invoked from the spec file or support file.`
    }

    strategies.forEach((strategy) => {
      commands.forEach((command) => {
        describe(`strategy: ${strategy}`, () => {
          describe(`command: ${command}`, () => {
            it('fails in html script', (done) => {
              cy.on('fail', (err) => {
                expect(err.message).to.include(errorForCommand(command))
                done()
              })

              cy.visit(`/aut-commands?strategy=${strategy}&command=${command}`)
            })

            it('fails in separate script', (done) => {
              cy.on('fail', (err) => {
                expect(err.message).to.include(errorForCommand(command))
                done()
              })

              cy.visit(`/fixtures/aut-commands.html?strategy=${strategy}&command=${command}`)
            })

            it('does not run command in separate script appended to spec frame', () => {
              let ranCommand = false

              cy.on('log:added', (attrs) => {
                if (attrs.name === command) {
                  ranCommand = true
                }
              })

              // this attempts to run the command by appending a <script> to the
              // spec frame, but the Content-Security-Policy we set will prevent
              // that script from running
              cy.visit(`/aut-commands?appendToSpecFrame=true&strategy=${strategy}&command=${command}`)
              // wait 500ms then ensure the command did not run
              cy.wait(500).then(() => {
                expect(ranCommand, `expected cy.${command}() not to run, but it did`).to.be.false
              })
            })

            // while not immediately obvious, this basically triggers using
            // cy.origin() within itself. that doesn't work anyways and
            // hits a different error, so it can't be used outside of the spec
            // in this manner
            if (command !== 'origin') {
              // cy.origin() doesn't currently have webkit support
              it('fails in cross-origin html script', { browser: '!webkit' }, (done) => {
                cy.on('fail', (err) => {
                  expect(err.message).to.include(errorForCommand(command))
                  done()
                })

                cy.origin('http://foobar.com:3500', { args: { strategy, command } }, ({ strategy, command }) => {
                  cy.visit(`/aut-commands?strategy=${strategy}&command=${command}`)
                })
              })

              // cy.origin() doesn't currently have webkit support
              it('fails in cross-origin separate script', { browser: '!webkit' }, (done) => {
                cy.on('fail', (err) => {
                  expect(err.message).to.include(errorForCommand(command))
                  done()
                })

                cy.origin('http://foobar.com:3500', { args: { strategy, command } }, ({ strategy, command }) => {
                  cy.visit(`/fixtures/aut-commands.html?strategy=${strategy}&command=${command}`)
                })
              })
            }
          })
        })
      })
    })
  })
})
