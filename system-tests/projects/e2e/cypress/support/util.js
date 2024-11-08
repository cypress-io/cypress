const { _ } = Cypress

let count = 1
let openInIdePath = Cypress.spec

// ensure title is unique since it's necessary for querying the UI
// in the verification step
const getTitle = (title, ctx) => {
  const parentTitle = ctx.parent && ctx.parent.title

  return `${parentTitle} ${title}`.trim()
}

export const fail = (title, ctx, test) => {
  const testTitle = `${count++}) ✗ FAIL - ${getTitle(title, ctx)}`

  it(testTitle, test)
}

export const verify = (title, ctx, options) => {
  const {
    before,
    line,
    column,
    message,
    stack,
    isCyOrigin,
    isPreprocessorWithTypescript,
  } = options

  const codeFrameFileRegex = new RegExp(`${Cypress.spec.relative}:${line}${column ? `:${column}` : ''}`)
  const stackFileRegex = new RegExp(`${Cypress.spec.relative}:${line}${column ? `:${column - 1}` : ''}`)

  it(`✓ VERIFY - ${title}`, function () {
    if (before) before()

    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .contains(`FAIL - ${getTitle(title, ctx)}`)
    .closest('.collapsible')
    .within(() => {
      cy.contains('View stack trace').click()

      _.each([].concat(message), (msg) => {
        cy.get('.runnable-err-message')
        .should('include.text', msg)

        cy.get('.runnable-err-stack-trace')
        .should('not.include.text', msg)
      })

      cy.get('.runnable-err-stack-trace')
      .invoke('text')
      .should('match', stackFileRegex)

      _.each([].concat(stack), (stackLine) => {
        cy.get('.runnable-err-stack-trace')
        .should('include.text', stackLine)
      })

      cy.get('.runnable-err-stack-trace')
      .should('not.include.text', '__stackReplacementMarker')

      cy.contains('.runnable-err-stack-trace .runnable-err-file-path', openInIdePath.relative)

      cy
      .get('.test-err-code-frame .runnable-err-file-path')
      .invoke('text')
      .should('match', codeFrameFileRegex)

      // code frames will show this as the 1st line
      if (isCyOrigin) {
        cy.get('.test-err-code-frame pre span').should('include.text', `('${title}',,function()`)
      } else if (isPreprocessorWithTypescript) {
        cy.get('.test-err-code-frame pre span').should('include.text', `'${title}',this,function(){`)
      } else {
        cy.get('.test-err-code-frame pre span').should('include.text', `fail('${title}',this,()=>`)
      }

      cy.contains('.test-err-code-frame .runnable-err-file-path', openInIdePath.relative)
    })
  })
}
