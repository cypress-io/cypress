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
    at foo.bar (http://localhost:1234/source_map_spec.js:12:4)
    at Context.<anonymous> (http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js:6:4)\
`
    })

    it('receives generated stack and returns object with source stack and parsed source stack', () => {
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
    at foo.bar (some_other_file.ts:2:2)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)

      expect(sourceStack.parsed).to.eql([
        {
          message: 'Error: spec iframe stack',
          whitespace: '',
        },
        {
          function: 'foo.bar',
          fileUrl: 'http://localhost:1234/source_map_spec.js',
          originalFile: 'some_other_file.ts',
          relativeFile: 'some_other_file.ts',
          absoluteFile: '/dev/app/some_other_file.ts',
          line: 2,
          column: 2,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          originalFile: 'cypress/integration/features/source_map_spec.coffee',
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
    at foo.bar (some_other_file.ts:2:2)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('works when first line is not the error message', () => {
      generatedStack = generatedStack.split('\n').slice(1).join('\n')
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`    at foo.bar (some_other_file.ts:2:2)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('works when first several lines are the error message', () => {
      generatedStack = `Some\nmore\nlines\n\n${generatedStack}`
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Some
more
lines

Error: spec iframe stack
    at foo.bar (some_other_file.ts:2:2)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:4)\
`)
    })

    it('strips webpack protocol from relativeFile and maintains it in originalFile', () => {
      $sourceMapUtils.getSourcePosition.returns({
        file: 'cypress:///some_other_file.ts',
        line: 2,
        column: 1,
      })

      $sourceMapUtils.getSourcePosition.onCall(1).returns({
        file: 'webpack:///cypress/integration/features/source_map_spec.coffee',
        line: 4,
        column: 3,
      })

      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
    at foo.bar (cypress:///some_other_file.ts:2:2)
    at Context.<anonymous> (webpack:///cypress/integration/features/source_map_spec.coffee:4:4)\
`)

      expect(sourceStack.parsed).to.eql([
        {
          message: 'Error: spec iframe stack',
          whitespace: '',
        },
        {
          function: 'foo.bar',
          fileUrl: 'http://localhost:1234/source_map_spec.js',
          originalFile: 'cypress:///some_other_file.ts',
          relativeFile: 'some_other_file.ts',
          absoluteFile: '/dev/app/some_other_file.ts',
          line: 2,
          column: 2,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          originalFile: 'webpack:///cypress/integration/features/source_map_spec.coffee',
          relativeFile: 'cypress/integration/features/source_map_spec.coffee',
          absoluteFile: '/dev/app/cypress/integration/features/source_map_spec.coffee',
          line: 4,
          column: 4,
          whitespace: '    ',
        },
      ])
    })

    it('returns empty object if there\'s no stack', () => {
      expect($stackUtils.getSourceStack()).to.eql({})
    })
  })

  context('.stackWithUserInvocationStackSpliced', () => {
    let err
    let userInvocationStack

    beforeEach(() => {
      err = new Error(`\
original message
original message line 2
original message line 3`)

      err.stack = `\
Error: original message
original message line 2
original message line 3
    at originalStack1 (path/to/file:1:1)
    at originalStack2 (path/to/file:1:1)
    at __stackReplacementMarker (path/to/another:2:2)
    at originalStack4 (path/to/file:1:1)
    at originalStack5 (path/to/file:1:1)`

      userInvocationStack = `\
user invocation message
user invocation message line 2
user invocation message line 3
    at userStack1 (path/to/another:2:2)
    at userStack2 (path/to/another:2:2)`
    })

    it('appends replaces the user invocation wrapper and all lines below it with the user invocation stack', () => {
      const { stack } = $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)

      expect(stack).to.equal(`\
Error: original message
original message line 2
original message line 3
    at originalStack1 (path/to/file:1:1)
    at originalStack2 (path/to/file:1:1)
From Your Spec Code:
    at userStack1 (path/to/another:2:2)
    at userStack2 (path/to/another:2:2)`)
    })

    it('returns the index of where the user invocation is in the stack', () => {
      const { index } = $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)

      expect(index).to.equal(6)
    })

    it('appends at end when there is no stack replacement marker in the stack', () => {
      err.stack = err.stack.replace('    at __stackReplacementMarker (path/to/another:2:2)\n', '')

      const { stack } = $stackUtils.stackWithUserInvocationStackSpliced(err, userInvocationStack)

      expect(stack).to.equal(`\
Error: original message
original message line 2
original message line 3
    at originalStack1 (path/to/file:1:1)
    at originalStack2 (path/to/file:1:1)
    at originalStack4 (path/to/file:1:1)
    at originalStack5 (path/to/file:1:1)
From Your Spec Code:
    at userStack1 (path/to/another:2:2)
    at userStack2 (path/to/another:2:2)`)
    })
  })

  context('.stackWithoutMessage', () => {
    it('returns stack with the foremost message lines', () => {
      const stack = `\
message 1
message 2
    at stack1 (foo.js:1:1)
message 3
    at stack2 (bar.js:2:2)`
      const result = $stackUtils.stackWithoutMessage(stack)

      expect(result).to.equal(`\
    at stack1 (foo.js:1:1)
message 3
    at stack2 (bar.js:2:2)`)
    })
  })

  context('.normalizedUserInvocationStack', () => {
    it('removes message and cy[name] lines and normalizes indentation', () => {
      const stack = `\
message 1
message 2
    at addCommand/cy[name]@cypress:///cy.js:0:0
  at stack1 (foo.js:1:1)
   at stack2 (bar.js:2:2)`
      const result = $stackUtils.normalizedUserInvocationStack(stack)

      expect(result).to.equal(`\
    at stack1 (foo.js:1:1)
    at stack2 (bar.js:2:2)`)
    })
  })
})
