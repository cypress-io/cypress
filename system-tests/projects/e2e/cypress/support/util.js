const { _ } = Cypress

let count = 1
let openInIdePath = Cypress.spec

// ensure title is unique since it's necessary for querying the UI
// in the verification step
const getTitle = (ctx) => {
  const parentTitle = ctx.parent && ctx.parent.title

  return `${parentTitle} ${ctx.title}`.trim()
}

export const fail = (ctx, test) => {
  const title = `${count++}) ✗ FAIL - ${getTitle(ctx)}`

  it(title, { defaultCommandTimeout: 0 }, test)
}

export const verify = (ctx, options) => {
  const {
    line,
    column,
    message,
    stack,
  } = options

  const fileRegex = new RegExp(`${Cypress.spec.relative}:${line}:${column}`)

  it(`✓ VERIFY`, function () {
    cy.wrap(Cypress.$(window.top.document.body))
    .find('.reporter')
    .contains(`FAIL - ${getTitle(ctx)}`)
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
      .should('match', fileRegex)

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
      .should('match', fileRegex)

      // code frames will show `fail(this,()=>` as the 1st line
      cy.get('.test-err-code-frame pre span').should('include.text', 'fail(this,()=>')

      cy.contains('.test-err-code-frame .runnable-err-file-path', openInIdePath.relative)
    })
  })
}
