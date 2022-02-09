import _ from 'lodash'
import defaultMessages from '@packages/frontend-shared/src/locales/en-US.json'

// Assert that either the the dialog is presented or the mutation is emitted, depending on
// whether the test has a preferred IDE defined.
const verifyIdeOpen = ({ file, action, hasPreferredIde }) => {
  if (hasPreferredIde) {
    cy.intercept('mutation-OpenFileInIDE', { data: { 'openFileInIDE': true } }).as('OpenIDE')

    action()

    cy.wait('@OpenIDE').then(({ request }) => {
      expect(request.body.variables.input.absolute).to.include(file)
    })
  } else {
    action()

    cy.contains(defaultMessages.globalPage.selectPreferredEditor).should('be.visible')
    cy.findByRole('button', { name: defaultMessages.actions.close }).click()
  }
}

export const verifyFailure = (options) => {
  const {
    specTitle,
    hasCodeFrame = true,
    verifyOpenInIde = true,
    hasPreferredIde,
    column,
    codeFrameText,
    originalMessage,
    message = [],
    notInMessage = [],
    command,
    stack,
    file,
    uncaught = false,
    uncaughtMessage,
  } = options
  let { regex, line } = options

  regex = regex || new RegExp(`${file}:${line || '\\d+'}:${column}`)

  cy.contains('.runnable-title', specTitle).closest('.runnable').as('Root')

  cy.get('@Root').within(() => {
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
  })

  if (verifyOpenInIde) {
    verifyIdeOpen({
      file,
      hasPreferredIde,
      action: () => {
        cy.get('@Root').contains('.runnable-err-stack-trace .runnable-err-file-path a', file)
        .click('left')
      },
    })
  }

  cy.get('@Root').within(() => {
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
  })

  if (verifyOpenInIde) {
    verifyIdeOpen({
      file,
      hasPreferredIde,
      action: () => {
        cy.get('@Root').contains('.test-err-code-frame .runnable-err-file-path a', file)
        .click()
      },
    })
  }
}

const createVerifyTest = (modifier?: string) => {
  return (title: string, opts: any, props?: any) => {
    if (!props) {
      props = opts
      opts = null
    }

    props.specTitle ||= title

    const verifyFn = props.verifyFn || verifyFailure.bind(null, props)

    return (modifier ? it[modifier] : it)(title, verifyFn)
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
