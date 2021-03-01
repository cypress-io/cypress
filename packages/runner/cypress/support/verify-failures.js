import _ from 'lodash'
import helpers from '../support/helpers'

const { runIsolatedCypress } = helpers.createCypress({
  config: { isTextTerminal: true, retries: 0 },
  visitUrl: 'http://localhost:3500/fixtures/isolated-runner-inner.html',
})

const verifyFailure = (options) => {
  const {
    hasCodeFrame = true,
    verifyOpenInIde = true,
    column,
    codeFrameText,
    message = [],
    notInMessage = [],
    command,
    stack,
    file,
    win,
  } = options
  let { regex, line } = options

  regex = regex || new RegExp(`${file}:${line || '\\d+'}:${column}`)

  const testOpenInIde = () => {
    expect(win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include(file)
  }

  win.runnerWs.emit.withArgs('get:user:editor')
  .yields({
    preferredOpener: {
      id: 'foo-editor',
      name: 'Foo',
      openerId: 'foo-editor',
      isOther: false,
    },
  })

  win.runnerWs.emit.withArgs('open:file')

  cy.contains('View stack trace').click()

  _.each([].concat(message), (msg) => {
    cy.get('.runnable-err-message')
    .should('include.text', msg)

    cy.get('.runnable-err-stack-trace')
    .should('not.include.text', msg)
  })

  _.each([].concat(notInMessage), (msg) => {
    cy.get('.runnable-err-message')
    .should('not.include.text', msg)
  })

  cy.get('.runnable-err-stack-trace')
  .invoke('text')
  .should('match', regex)

  if (stack) {
    _.each([].concat(stack), (stackLine) => {
      cy.get('.runnable-err-stack-trace')
      .should('include.text', stackLine)
    })
  }

  cy.get('.runnable-err-stack-trace')
  .should('not.include.text', '__stackReplacementMarker')

  if (verifyOpenInIde) {
    cy.contains('.runnable-err-stack-trace .runnable-err-file-path a', file)
    .click('left')
    .should(() => {
      testOpenInIde()
    })
  }

  if (command) {
    cy
    .get('.command-state-failed')
    .should('have.length', 1)
    .find('.command-method')
    .invoke('text')
    .should('equal', command)
  }

  if (!hasCodeFrame) return

  cy
  .get('.test-err-code-frame .runnable-err-file-path')
  .invoke('text')
  .should('match', regex)

  cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText)

  if (verifyOpenInIde) {
    cy.contains('.test-err-code-frame .runnable-err-file-path a', file)
    .click()
    .should(() => {
      expect(win.runnerWs.emit.withArgs('open:file')).to.be.calledTwice
      testOpenInIde()
    })
  }
}

const createVerifyTest = (modifier) => {
  return (title, opts, props) => {
    if (!props) {
      props = opts
      opts = null
    }

    const verifyFn = props.verifyFn || verifyFailure

    const args = _.compact([title, opts, () => {
      return runIsolatedCypress(`cypress/fixtures/errors/${props.file}`, {
        visitUrl: props.visitUrl,
        onBeforeRun ({ specWindow, win, autCypress }) {
          specWindow.testToRun = title
          specWindow.autWindow = win
          specWindow.autCypress = autCypress

          if (props.onBeforeRun) {
            props.onBeforeRun({ specWindow, win })
          }
        },
      })
      .then(({ win }) => {
        props.codeFrameText = props.codeFrameText || title
        props.win = win
        verifyFn(props, verifyFailure)
      })
    }])

;(modifier ? it[modifier] : it)(...args)
  }
}

export const verify = {
  it: createVerifyTest(),
}

verify.it['only'] = createVerifyTest('only')
verify.it['skip'] = createVerifyTest('skip')

export const verifyInternalFailure = (props) => {
  const { method, stackMethod } = props

  cy.get('.runnable-err-message')
  .should('include.text', `thrown in ${method.replace(/\./g, '-')}`)

  cy.get('.runnable-err-stack-expander > .collapsible-header').click()

  cy.get('.runnable-err-stack-trace')
  .should('include.text', stackMethod || method)

  // this is an internal cypress error and we can only show code frames
  // from specs, so it should not show the code frame
  cy.get('.test-err-code-frame')
  .should('not.exist')
}
