const { _ } = Cypress

let count = 1
let shouldVerifyStackLineIsSpecFile = true

// ensure title is unique since it's necessary for querying the UI
// in the verification step
const getTitle = (ctx) => {
  const parentTitle = ctx.parent && ctx.parent.title

  return `${parentTitle} ${ctx.title}`.trim()
}

export const setup = ({ verifyStackLineIsSpecFile }) => {
  shouldVerifyStackLineIsSpecFile = verifyStackLineIsSpecFile
}

// NOTE: use { defaultCommandTimeout: 0 } once per-test configuration is
// implemented (https://github.com/cypress-io/cypress/pull/5346)
export const fail = (ctx, test) => {
  const title = `${count++}) ✗ FAIL - ${getTitle(ctx)}`
  const withDone = test.length > 0

  if (withDone) {
    it(title, (done) => {
      cy.timeout(0) // speed up failures to not retry since we know they should fail

      return test(done)
    })

    return
  }

  it(title, () => {
    cy.timeout(0) // speed up failures to not retry since we know they should fail

    return test()
  })
}

export const verify = (ctx, options) => {
  const { hasCodeFrame = true, column, codeFrameText, message, stack } = options
  let { regex } = options

  // test only the column number because the line number is brittle
  // since any changes to this file can affect it
  if (!regex) {
    regex = shouldVerifyStackLineIsSpecFile ?
      new RegExp(`${Cypress.spec.relative}:\\d+:${column}`) :
      new RegExp(`cypress\/support\/commands\.js:\\d+:${column}`)
  }

  it(`✓ VERIFY`, () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .contains(`FAIL - ${getTitle(ctx)}`)
    .closest('.runnable-wrapper')
    .within(() => {
      _.each([].concat(message), (msg) => {
        cy.get('.runnable-err-message')
        .should('include.text', msg)

        // TODO: get this working. it currently fails in a bizarre way
        // displayed stack trace should not include message
        // cy.get('.runnable-err-stack-trace')
        // .invoke('text')
        // .should('not.include.text', msg)
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

      if (!hasCodeFrame) return

      cy
      .get('.test-err-code-frame .runnable-err-file-path')
      .invoke('text')
      .should('match', regex)

      // most code frames will show `fail(this,()=>` as the 1st line but
      // for some it's cut off due to the test code being more lines,
      // so we prefer the `codeFrameText`
      cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText || 'fail(this,()=>')
    })
  })
}

export const verifyInternalError = (ctx, { method }) => {
  it(`✓ VERIFY`, () => {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .contains(`FAIL - ${getTitle(ctx)}`)
    .closest('.runnable-wrapper')
    .within(() => {
      cy.get('.runnable-err-message')
      .should('include.text', `thrown in ${method.replace(/\./g, '')}`)

      cy.get('.runnable-err-stack-trace')
      .should('include.text', method)

      cy.get('.test-err-code-frame')
      .should('not.exist')
    })
  })
}

export const sendXhr = (win) => {
  const xhr = new win.XMLHttpRequest()

  xhr.open('GET', '/foo')
  xhr.send()

  return xhr
}

export const abortXhr = (win) => {
  const xhr = sendXhr(win)

  xhr.abort()
}
