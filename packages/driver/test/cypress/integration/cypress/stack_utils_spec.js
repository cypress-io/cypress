const $stackUtils = require('../../../../src/cypress/stack_utils')
const $sourceMapUtils = require('../../../../src/cypress/source_map_utils')

describe('driver/src/cypress/stack_utils', () => {
  context('.combineMessageAndStack', () => {
    const err = { message: 'We want this message\n\nand this line' }
    const stack = `We do not want this message
or this message
or this one
  at we (want/this/stack/line)
  at and (this/line/too)
`

    it('returns stack if no error', () => {
      expect($stackUtils.combineMessageAndStack(undefined, stack)).to.equal(stack)
    })

    it('returns message of error combined with stack', () => {
      expect($stackUtils.combineMessageAndStack(err, stack)).to.equal(`We want this message

and this line
  at we (want/this/stack/line)
  at and (this/line/too)
`)
    })

    it('removes lines with __getSpecFrameStack', () => {
      const stack2 = stack.replace('at we', 'at __getSpecFrameStack')

      expect($stackUtils.combineMessageAndStack(err, stack2)).to.equal(`We want this message

and this line
  at and (this/line/too)
`)
    })
  })

  context('.getCodeFrame', () => {
    let originalErr
    const sourceCode = `it('is a failing test', () => {
  cy.get('.not-there')
})\
`

    beforeEach(() => {
      originalErr = {
        parsedStack: [
          { message: 'Only a message' },
          {
            fileUrl: 'http://localhost:12345/__cypress/tests?p=cypress/integration/features/source_map_spec.js',
            absoluteFile: '/dev/app/cypress/integration/features/source_map_spec.js',
            relativeFile: 'cypress/integration/features/source_map_spec.js',
            line: 2,
            column: 5,
          },
        ],
      }
    })

    it('returns existing code frame if error already has one', () => {
      const existingCodeFrame = {}

      originalErr.codeFrame = existingCodeFrame

      expect($stackUtils.getCodeFrame(originalErr)).to.equal(existingCodeFrame)
    })

    it('returns undefined if there is no parsed stack', () => {
      originalErr.parsedStack = undefined

      expect($stackUtils.getCodeFrame(originalErr)).to.be.undefined
    })

    it('returns undefined if parsed stack is empty', () => {
      originalErr.parsedStack = []

      expect($stackUtils.getCodeFrame(originalErr)).to.be.undefined
    })

    it('returns undefined if there are only message lines', () => {
      originalErr.parsedStack = [{ message: 'Only a message' }]

      expect($stackUtils.getCodeFrame(originalErr)).to.be.undefined
    })

    it('returns code frame from first stack line', () => {
      cy.stub($sourceMapUtils, 'getSourceContents').returns(sourceCode)

      const codeFrame = $stackUtils.getCodeFrame(originalErr)

      expect(codeFrame).to.be.an('object')
      expect(codeFrame.frame).to.contain(`  1 | it('is a failing test', () => {`)
      expect(codeFrame.frame).to.contain(`> 2 |   cy.get('.not-there'`)
      expect(codeFrame.frame).to.contain(`    |     ^`)
      expect(codeFrame.frame).to.contain(`  3 | }`)
      expect(codeFrame.absoluteFile).to.equal('/dev/app/cypress/integration/features/source_map_spec.js')
      expect(codeFrame.relativeFile).to.equal('cypress/integration/features/source_map_spec.js')
      expect(codeFrame.language).to.equal('js')
      expect(codeFrame.line).to.equal(2)
      expect(codeFrame.column).to.eq(5)
    })

    it('does not add code frame if stack does not yield one', () => {
      cy.stub($sourceMapUtils, 'getSourceContents').returns(null)

      expect($stackUtils.getCodeFrame(originalErr)).to.be.undefined
    })
  })

  context('.getSourceStack', () => {
    let generatedStack
    const projectRoot = '/dev/app'

    beforeEach(() => {
      cy.stub($sourceMapUtils, 'getSourcePosition').returns({
        source: 'some_other_file.ts',
        line: 2,
        column: 1,
      })

      $sourceMapUtils.getSourcePosition.onCall(1).returns({
        source: 'cypress/integration/features/source_map_spec.coffee',
        line: 4,
        column: 3,
      })

      generatedStack = `Error: spec iframe stack
${'    '}at foo.bar (http://localhost:1234/source_map_spec.js:12:4)
${'    '}at Context.<anonymous> (http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js:6:4)\
`
    })

    it('receives generated stack and returns object with source stack and parsed source stack', () => {
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
${'    '}at foo.bar (some_other_file.ts:2:2)
${'    '}at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)

      expect(sourceStack.parsed).to.eql([
        {
          message: 'Error: spec iframe stack',
          whitespace: '',
        },
        {
          function: 'foo.bar',
          fileUrl: 'http://localhost:1234/source_map_spec.js',
          relativeFile: 'some_other_file.ts',
          absoluteFile: '/dev/app/some_other_file.ts',
          line: 2,
          column: 2,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          relativeFile: 'cypress/integration/features/source_map_spec.coffee',
          absoluteFile: '/dev/app/cypress/integration/features/source_map_spec.coffee',
          line: 4,
          column: 4,
          whitespace: '    ',
        },
      ])
    })

    it('works when first line is the error message', () => {
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
${'    '}at foo.bar (some_other_file.ts:2:2)
${'    '}at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('works when first line is not the error message', () => {
      generatedStack = generatedStack.split('\n').slice(1).join('\n')
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`    at foo.bar (some_other_file.ts:2:2)
${'    '}at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('works when first several lines are the error message', () => {
      generatedStack = `Some\nmore\nlines\n\n${generatedStack}`
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Some
more
lines

Error: spec iframe stack
${'    '}at foo.bar (some_other_file.ts:2:2)
${'    '}at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('returns empty object if there\'s no stack', () => expect($stackUtils.getSourceStack()).to.eql({}))
  })
})
