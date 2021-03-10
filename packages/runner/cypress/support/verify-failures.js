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
    originalMessage,
    message = [],
    notInMessage = [],
    command,
    stack,
    file,
    win,
    uncaught = false,
    uncaughtMessage,
  } = options
  let { regex, line } = options

  regex = regex || new RegExp(`${file}:${line || '\\d+'}:${column}`)

  const testOpenInIde = () => {
    cy.log('open in IDE works').then(() => {
      expect(win.runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.include(file)
    })
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

  const messageLines = [].concat(message)

  if (messageLines.length) {
    cy.log('message contains expected lines and stack does not include message')

    _.each(messageLines, (msg) => {
      cy.get('.runnable-err-message')
      .should('include.text', msg)

      cy.get('.runnable-err-stack-trace')
      .should('not.include.text', msg)
    })
  }

  if (originalMessage) {
    cy.get('.runnable-err-message')
    .should('include.text', originalMessage)
  }

  const notInMessageLines = [].concat(notInMessage)

  if (notInMessageLines.length) {
    cy.log('message does not contain the specified lines')

    _.each(notInMessageLines, (msg) => {
      cy.get('.runnable-err-message')
      .should('not.include.text', msg)
    })
  }

  cy.log('stack trace matches the specified pattern')
  cy.get('.runnable-err-stack-trace')
  .invoke('text')
  .should('match', regex)

  if (stack) {
    const stackLines = [].concat(stack)

    if (stackLines.length) {
      cy.log('stack contains the expected lines')
    }

    _.each(stackLines, (stackLine) => {
      cy.get('.runnable-err-stack-trace')
      .should('include.text', stackLine)
    })
  }

  cy.get('.runnable-err-stack-trace')
  .invoke('text')
  .should('not.include', '__stackReplacementMarker')
  .should((stackTrace) => {
    // if this stack trace has the 'From Your Spec Code' addendum,
    // it should only appear once
    const match = stackTrace.match(/From Your Spec Code/g)

    if (match && match.length) {
      expect(match.length, `'From Your Spec Code' should only be in the stack once, but found ${match.length} instances`).to.equal(1)
    }
  })

  if (verifyOpenInIde) {
    cy.contains('.runnable-err-stack-trace .runnable-err-file-path a', file)
    .click('left')
    .should(() => {
      testOpenInIde()
    })
  }

  if (command) {
    cy.log('the error is attributed to the correct command')
    cy
    .get('.command-state-failed')
    .first()
    .find('.command-method')
    .invoke('text')
    .should('equal', command)
  }

  if (uncaught) {
    cy.log('uncaught error has an associated log for the original error')
    cy.get('.command-name-uncaught-exception')
    .should('have.length', 1)
    .should('have.class', 'command-state-failed')
    .find('.command-message-text')
    .should('include.text', uncaughtMessage || originalMessage)
  } else {
    cy.log('"caught" error does not have an uncaught error log')
    cy.get('.command-name-uncaught-exception').should('not.exist')
  }

  if (!hasCodeFrame) return

  cy.log('code frame matches specified pattern')
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
