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

    it('passes two or more exact commands in a row', () => {
      cy.task('return:arg', 'arg')
      cy.task('return:arg', 'arg')
    })

    // https://github.com/cypress-io/cypress/issues/27099
    it('passes with large payloads', () => {
      const hugeJson = Cypress._.times(3000).map(() => {
        return {
          key1: 'value 1',
          key2: {
            key3: 'value 3',
            key4: {
              key5: 'value 5',
            },
          },
        }
      })

      cy.task('return:arg', hugeJson)
      cy.writeFile('cypress/_test-output/huge-out.json', hugeJson)
    })

    it('handles undefined argument(s)', () => {
      // these intentionally use different tasks because otherwise there can
      // be false positives due to them equating to the same call
      cy.task('arg:is:undefined').should('equal', 'arg was undefined')
      cy.task('return:foo', undefined).should('equal', 'foo')
      cy.task('return:bar', undefined, undefined).should('equal', 'bar')
      cy.task('return:baz', undefined, { timeout: 9999 }).should('equal', 'baz')
    })

    it('handles null argument(s)', () => {
      cy.task('return:arg', null).should('be.null')
      // @ts-expect-error
      cy.task('return:arg', null, null).should('be.null')
      cy.task('return:arg', null, { timeout: 9999 }).should('be.null')
    })

    it('handles extra, unexpected arguments', () => {
      // @ts-expect-error
      cy.exec('echo "hey-o"', { log: true }, { should: 'be ignored' })
      // @ts-expect-error
      cy.readFile('cypress/fixtures/app.json', 'utf-8', { log: true }, { should: 'be ignored' })
      // @ts-expect-error
      cy.writeFile('cypress/_test-output/written.json', 'contents', 'utf-8', { log: true }, { should: 'be ignored' })
      // @ts-expect-error
      cy.task('return:arg', 'arg2', { log: true }, { should: 'be ignored' })
      // @ts-expect-error
      cy.get('#basic').selectFile('cypress/fixtures/valid.json', { log: true }, { should: 'be ignored' })
      if (!isWebkit) {
        // @ts-expect-error
        cy.origin('http://foobar.com:3500', {}, () => {}, { should: 'be ignored' })
      }
    })

    it('handles ArrayBuffer arguments', () => {
      cy.task('return:arg', new ArrayBuffer(10))
    })

    it('handles Buffer arguments', () => {
      cy.task('return:arg', Cypress.Buffer.from('contents'))
      cy.writeFile('cypress/_test-output/written.json', Cypress.Buffer.from('contents'))
    })

    it('handles TypedArray arguments', () => {
      cy.get('#basic').selectFile(Uint8Array.from([98, 97, 122]))
    })

    it('handles args being mutated', () => {
      const obj = { foo: 'bar' }

      cy.wait(10).then(() => {
        obj.foo = 'baz'
      })

      cy.task('return:arg', obj)
      cy.writeFile('cypress/_test-output/written.json', obj)
    })

    it('handles evaled code', () => {
      window.eval(`
        cy.task('return:arg', 'eval arg')
        .then(() => {
          cy.task('return:arg', 'then eval arg')
        })

        cy.get('body')
        .each(() => {
          cy.task('return:arg', 'each eval arg')
        })
        .within(() => {
          cy.task('return:arg', 'within eval arg')
        })
      `)
    })

    it('allows web workers in spec frame', () => {
      const workerScript = `postMessage('hello from worker')`
      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const workerURL = URL.createObjectURL(blob)
      const worker = new Worker(workerURL)

      return new Promise<void>((resolve) => {
        worker.onmessage = ({ data }) => {
          expect(data).to.equal('hello from worker')

          resolve()
        }
      })
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
        cy.exec('echo "hello"')
        cy.readFile('cypress/fixtures/app.json')
        cy.writeFile('cypress/_test-output/written.json', 'contents')
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
      describe(`strategy: ${strategy}`, () => {
        commands.forEach((command) => {
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
