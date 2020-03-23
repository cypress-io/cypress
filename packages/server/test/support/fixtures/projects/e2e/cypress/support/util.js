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

export const fail = (ctx, test) => {
  // NOTE: use { defaultCommandTimeout: 0 } once per-test configuration is
  // implemented (https://github.com/cypress-io/cypress/pull/5346)
  it(`${count++}) ✗ FAIL - ${getTitle(ctx)}`, () => {
    cy.timeout(0) // speed up failures to not retry since we know they should fail

    return test()
  })
}

export const verify = (ctx, { column, codeFrameText, message, regex }) => {
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
      cy.get('.runnable-err-message')
      .should('include.text', message)

      cy.get('.runnable-err-stack-trace')
      .invoke('text')
      .should('match', regex)

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
