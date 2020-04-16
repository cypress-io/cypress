const $stackUtils = require('../../../../src/cypress/stack_utils')
const $sourceMapUtils = require('../../../../src/cypress/source_map_utils')

describe('driver/src/cypress/stack_utils', () => {
  context('.replacedStack', () => {
    const message = 'Original error\n\nline 2'

    it('returns stack with original message', () => {
      const err = new Error(message)
      const newStack = 'at foo (path/to/file.js:1:1)\nat bar (path/to/file.js:2:2)'
      const stack = $stackUtils.replacedStack(err, newStack)

      expect(stack).to.equal(`Error: ${message}\n${newStack}`)
    })

    it('does not replace stack if error has no stack', () => {
      const err = new Error(message)

      err.stack = ''
      const stack = $stackUtils.replacedStack(err, 'new stack')

      expect(stack).to.equal('')
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
        file: 'some_other_file.ts',
        line: 2,
        column: 1,
      })

      $sourceMapUtils.getSourcePosition.onCall(1).returns({
        file: 'cypress/integration/features/source_map_spec.coffee',
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

    it('returns empty object if there\'s no stack', () => {
      expect($stackUtils.getSourceStack()).to.eql({})
    })
  })

  context('.stackWithOriginalAppended', () => {
    let err
    let originalErr

    beforeEach(() => {
      err = {
        stack: 'error message\n  at theStack (path/to/file:1:1)',
      }

      originalErr = {
        stackTitle: 'Stack Title',
        stack: 'original message\n  at theOriginalStack (path/to/another:2:2)',
      }
    })

    it('appends originalErr stackTitle and stack', () => {
      const result = $stackUtils.stackWithOriginalAppended(err, originalErr)

      expect(result).to.equal(`\
error message
  at theStack (path/to/file:1:1)
Stack Title:
  at theOriginalStack (path/to/another:2:2)`)
    })

    it('returns err.stack if no originalErr', () => {
      const result = $stackUtils.stackWithOriginalAppended(err)

      expect(result).to.equal(err.stack)
    })

    it('returns err.stack if no originalErr.stack', () => {
      originalErr.stack = ''

      const result = $stackUtils.stackWithOriginalAppended(err, originalErr)

      expect(result).to.equal(err.stack)
    })

    it('removes original stack message by default', () => {
      const result = $stackUtils.stackWithOriginalAppended(err, originalErr)

      expect(result).not.to.include('original message')
    })

    it('throws if no stackTitle property is provided', () => {
      originalErr.stackTitle = undefined

      const fn = () => $stackUtils.stackWithOriginalAppended(err, originalErr)

      expect(fn).to.throw('From $stackUtils.stackWithOriginalAppended: the original error needs to have a stackTitle property')
    })

    describe('when removeMessage is false', () => {
      let result

      beforeEach(() => {
        originalErr.removeMessage = false

        result = $stackUtils.stackWithOriginalAppended(err, originalErr)
      })

      it('does not remove original stack message if removeMessage is false', () => {
        expect(result).to.include('original message')
      })

      it('adds extra new lines if removeMessage is false', () => {
        expect(result).to.equal(`\
error message
  at theStack (path/to/file:1:1)

Stack Title:

original message
  at theOriginalStack (path/to/another:2:2)`)
      })
    })
  })

  context('.stackWithoutMessage', () => {
    const stack = `\
message 1
message 2
  at stack1 (foo.js:1:1)
message 3
  at stack2 (bar.js:2:2)`

    it('returns stack with the foremost message lines', () => {
      const result = $stackUtils.stackWithoutMessage(stack)

      expect(result).to.equal(`\
  at stack1 (foo.js:1:1)
message 3
  at stack2 (bar.js:2:2)`)
    })
  })
})
