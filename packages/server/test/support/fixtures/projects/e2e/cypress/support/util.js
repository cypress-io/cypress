const { _ } = Cypress

let count = 1
let shouldVerifyStackLineIsSpecFile = true
let openInIdePath = Cypress.spec

// ensure title is unique since it's necessary for querying the UI
// in the verification step
const getTitle = (ctx) => {
  const parentTitle = ctx.parent && ctx.parent.title

  return `${parentTitle} ${ctx.title}`.trim()
}

export const setup = ({ verifyStackLineIsSpecFile, idePath }) => {
  shouldVerifyStackLineIsSpecFile = verifyStackLineIsSpecFile
  if (idePath) openInIdePath = idePath
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
  const {
    hasCodeFrame = true,
    verifyOpenInIde = true,
    verifyDocsContent,
    verifyDocsLearnMore,
    column,
    codeFrameText,
    message,
    stack,
  } = options
  let { regex, line } = options

  // if no specific line, just accept any number
  line = line || '\\d+'

  // test only the column number because the line number is brittle
  // since any changes to this file can affect it
  if (!regex) {
    regex = shouldVerifyStackLineIsSpecFile ?
      new RegExp(`${Cypress.spec.relative}:${line}:${column}`) :
      new RegExp(`cypress\/support\/commands\.js:${line}:${column}`)
  }

  const testOpenInIde = (runnerWs) => {
    if (_.isRegExp(openInIdePath.absolute)) {
      expect(runnerWs.emit.withArgs('open:file').lastCall.args[1].file).to.match(openInIdePath.absolute)
    } else {
      expect(runnerWs.emit).to.be.calledWithMatch('open:file', {
        file: openInIdePath.absolute,
      })
    }
  }

  it(`✓ VERIFY`, function () {
    const currTest = this.test
    const currTestIndex = Cypress._.findIndex(ctx.tests, (test) => {
      return test === currTest
    })
    // find the previous test in the suite
    const prevTest = ctx.tests[currTestIndex - 1]

    const runnerWs = window.top.runnerWs

    cy.stub(window.top.runnerWs, 'emit').callThrough().withArgs('get:user:editor')
    .yields({
      preferredOpener: {
        id: 'foo-editor',
        name: 'Foo',
        openerId: 'foo-editor',
        isOther: false,
      },
    })

    window.top.runnerWs.emit.callThrough().withArgs('open:file')

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

      cy.contains('View stack trace').click()

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

      const docsUrl = _.get(prevTest, 'err.docsUrl')

      if (verifyDocsLearnMore) {
        expect(docsUrl).to.eq(verifyDocsLearnMore)

        // make sure Learn More is there
        // and the docs url is not embedded
        // in the error message
        cy
        .get('.runnable-err-message')
        .should('not.contain', docsUrl)
        .contains('Learn more')
        .should('have.attr', 'href', docsUrl)
      }

      if (verifyDocsContent) {
        expect(docsUrl).to.be.undefined

        // verify that the docsUrl is
        // embedded in the content, but
        // that there's no Learn More link
        cy
        .get('.runnable-err-message')
        .should('contain', verifyDocsContent)
        .contains('Learn more')
        .should('not.exist')
      }

      if (verifyOpenInIde) {
        cy.contains('.runnable-err-stack-trace .runnable-err-file-path', openInIdePath.relative)
        .click()
        .should(() => {
          testOpenInIde(runnerWs)
        })
      }

      if (!hasCodeFrame) return

      cy
      .get('.test-err-code-frame .runnable-err-file-path')
      .invoke('text')
      .should('match', regex)

      // most code frames will show `fail(this,()=>` as the 1st line but
      // for some it's cut off due to the test code being more lines,
      // so we prefer the `codeFrameText`
      cy.get('.test-err-code-frame pre span').should('include.text', codeFrameText || 'fail(this,()=>')

      if (verifyOpenInIde) {
        cy.contains('.test-err-code-frame .runnable-err-file-path', openInIdePath.relative)
        .click()
        .should(() => {
          expect(runnerWs.emit.withArgs('open:file')).to.be.calledTwice
          testOpenInIde(runnerWs)
        })
      }
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
