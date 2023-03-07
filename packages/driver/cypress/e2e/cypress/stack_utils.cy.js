const $stackUtils = require('@packages/driver/src/cypress/stack_utils').default
const $sourceMapUtils = require('@packages/driver/src/cypress/source_map_utils').default

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

  context('getRelativePathFromRoot', () => {
    const relativeFile = 'relative/path/to/file.js'
    const absoluteFile = 'User/ruby/cypress/packages/driver/relative/path/to/file.js'
    const repoRoot = 'User/ruby/cypress'
    const relativePathFromRoot = 'packages/driver/relative/path/to/file.js'

    const actualPlatform = Cypress.config('platform')
    const actualRepoRoot = Cypress.config('repoRoot')

    after(() => {
      // restore config values to prevent bleeding into subsequent tests
      Cypress.config('platform', actualPlatform)
      Cypress.config('repoRoot', actualRepoRoot)
    })

    it('returns relativeFile if absoluteFile is empty', () => {
      const result = $stackUtils.getRelativePathFromRoot(relativeFile, undefined)

      expect(result).to.equal(relativeFile)
    })

    it('returns relativeFile if `repoRoot` is not set in the config', () => {
      const result = $stackUtils.getRelativePathFromRoot(relativeFile, absoluteFile)

      expect(result).to.equal(relativeFile)
    })

    it('returns relativeFile if absoluteFile does not start with `repoRoot`', () => {
      Cypress.config('repoRoot', 'User/ruby/test-repo')
      const result = $stackUtils.getRelativePathFromRoot(relativeFile, absoluteFile)

      expect(result).to.equal(relativeFile)
    })

    it('returns the relative path from root if the absoluteFile starts with `repoRoot`', () => {
      Cypress.config('repoRoot', repoRoot)
      const result = $stackUtils.getRelativePathFromRoot(relativeFile, absoluteFile)

      expect(result).to.equal(relativePathFromRoot)
    })

    it('uses posix on windows', () => {
      Cypress.config('repoRoot', 'C:/Users/Administrator/Documents/GitHub/cypress')
      Cypress.config('platform', 'win32')
      const absoluteFile = 'C:\\Users\\Administrator\\Documents\\GitHub\\cypress\\packages\\app/cypress/e2e/reporter_header.cy.ts'
      const relativeFile = 'cypress/e2e/reporter_header.cy.ts'
      const result = $stackUtils.getRelativePathFromRoot(relativeFile, absoluteFile)

      expect(result).to.equal('packages/app/cypress/e2e/reporter_header.cy.ts')
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
      expect(codeFrame.frame).to.contain(`    |      ^`)
      expect(codeFrame.frame).to.contain(`  3 | }`)
      expect(codeFrame.absoluteFile).to.equal('/dev/app/cypress/integration/features/source_map_spec.js')
      expect(codeFrame.relativeFile).to.equal('cypress/integration/features/source_map_spec.js')
      expect(codeFrame.language).to.equal('js')
      expect(codeFrame.line).to.equal(2)
      expect(codeFrame.column).to.eq(6)
    })

    it('does not add code frame if stack does not yield one', () => {
      cy.stub($sourceMapUtils, 'getSourceContents').returns(null)

      expect($stackUtils.getCodeFrame(originalErr)).to.be.undefined
    })

    it('relativeFile is relative to the repo root when `absoluteFile` starts with `repoRoot`', () => {
      Cypress.config('repoRoot', '/dev')
      cy.stub($sourceMapUtils, 'getSourceContents').returns(sourceCode)
      const codeFrame = $stackUtils.getCodeFrame(originalErr)

      expect(codeFrame.relativeFile).to.equal('app/cypress/integration/features/source_map_spec.js')
    })
  })

  context('.getSourceStack when http links', () => {
    it('does not have absolute files', () => {
      const projectRoot = '/dev/app'

      cy.fixture('error-stack-with-http-links.txt')
      .then((stack) => {
        return $stackUtils.getSourceStack(stack, projectRoot)
      })
      .its('parsed')
      .then((parsed) => {
        return Cypress._.find(parsed, { fileUrl: 'http://localhost:8888/js/utils.js' })
      })
      .then((errorLocation) => {
        expect(errorLocation, 'does not have disk information').to.deep.equal({
          absoluteFile: undefined,
          column: 3,
          fileUrl: 'http://localhost:8888/js/utils.js',
          function: '<unknown>',
          line: 9,
          originalFile: 'http://localhost:8888/js/utils.js',
          relativeFile: undefined,
          whitespace: '    ',
        })
      })
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
    at foo.bar (some_other_file.ts:2:1)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:3)\
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
          column: 1,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          originalFile: 'cypress/integration/features/source_map_spec.coffee',
          relativeFile: 'cypress/integration/features/source_map_spec.coffee',
          absoluteFile: '/dev/app/cypress/integration/features/source_map_spec.coffee',
          line: 4,
          column: 3,
          whitespace: '    ',
        },
      ])
    })

    it('works when first line is the error message', () => {
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
    at foo.bar (some_other_file.ts:2:1)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:3)\
`)
    })

    it('works when first line is not the error message', () => {
      generatedStack = generatedStack.split('\n').slice(1).join('\n')
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`    at foo.bar (some_other_file.ts:2:1)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:3)\
`)
    })

    it('works when first several lines are the error message', () => {
      generatedStack = `Some\nmore\nlines\n\n${generatedStack}`
      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Some
more
lines

Error: spec iframe stack
    at foo.bar (some_other_file.ts:2:1)
    at Context.<anonymous> (cypress/integration/features/source_map_spec.coffee:4:3)\
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
    at foo.bar (cypress:///some_other_file.ts:2:1)
    at Context.<anonymous> (webpack:///cypress/integration/features/source_map_spec.coffee:4:3)\
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
          column: 1,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          originalFile: 'webpack:///cypress/integration/features/source_map_spec.coffee',
          relativeFile: 'cypress/integration/features/source_map_spec.coffee',
          absoluteFile: '/dev/app/cypress/integration/features/source_map_spec.coffee',
          line: 4,
          column: 3,
          whitespace: '    ',
        },
      ])
    })

    it('strips webpack protocol and maintains absolute path', () => {
      $sourceMapUtils.getSourcePosition.returns({
        file: 'cypress:////root/absolute/path/some_other_file.ts',
        line: 2,
        column: 1,
      })

      $sourceMapUtils.getSourcePosition.onCall(1).returns({
        file: 'webpack:////root/absolute/path/cypress/integration/features/source_map_spec.coffee',
        line: 4,
        column: 3,
      })

      const sourceStack = $stackUtils.getSourceStack(generatedStack, projectRoot)

      expect(sourceStack.sourceMapped).to.equal(`Error: spec iframe stack
    at foo.bar (cypress:////root/absolute/path/some_other_file.ts:2:1)
    at Context.<anonymous> (webpack:////root/absolute/path/cypress/integration/features/source_map_spec.coffee:4:3)\
`)

      expect(sourceStack.parsed).to.eql([
        {
          message: 'Error: spec iframe stack',
          whitespace: '',
        },
        {
          function: 'foo.bar',
          fileUrl: 'http://localhost:1234/source_map_spec.js',
          originalFile: 'cypress:////root/absolute/path/some_other_file.ts',
          relativeFile: '/root/absolute/path/some_other_file.ts',
          absoluteFile: '/root/absolute/path/some_other_file.ts',
          line: 2,
          column: 1,
          whitespace: '    ',
        },
        {
          function: 'Context.<anonymous>',
          fileUrl: 'http://localhost:1234/tests?p=cypress/integration/features/source_map_spec.js',
          originalFile: 'webpack:////root/absolute/path/cypress/integration/features/source_map_spec.coffee',
          relativeFile: '/root/absolute/path/cypress/integration/features/source_map_spec.coffee',
          absoluteFile: '/root/absolute/path/cypress/integration/features/source_map_spec.coffee',
          line: 4,
          column: 3,
          whitespace: '    ',
        },
      ])
    })

    it('returns empty object if there\'s no stack', () => {
      expect($stackUtils.getSourceStack()).to.eql({})
    })
  })

  context('.getSourceDetailsForFirstLine', () => {
    it('parses good stack trace', () => {
      const stack = `
        Error
          at Suite.eval (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:101:3)
          at Object../cypress/integration/spec.js (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:100:1)
          at __webpack_require__ (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:20:30)
          at Object.0 (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:119:18)
          at __webpack_require__ (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:20:30)
          at eval (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:84:18)
          at eval (http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js:87:10)
          at eval (<anonymous>)
      `
      const projectRoot = '/Users/gleb/git/cypress-example-todomvc'
      const details = $stackUtils.getSourceDetailsForFirstLine(stack, projectRoot)

      expect(details.function, 'function name').to.equal('Suite.eval')
      expect(details.fileUrl, 'file url').to.equal('http://localhost:8888/__cypress/tests?p=cypress/integration/spec.js')
    })

    it('parses anonymous eval line', () => {
      const stack = `
        SyntaxError: The following error originated from your application code, not from Cypress.

          > Identifier 'app' has already been declared

        When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

        This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.
        SyntaxError: The following error originated from your application code, not from Cypress.

          > Identifier 'app' has already been declared

        When Cypress detects uncaught errors originating from your application it will automatically fail the current test.

        This behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.
            at <anonymous>:1:1
            at run (http://localhost:8888/node_modules/react/dist/JSXTransformer.js:184:10)
            at check (http://localhost:8888/node_modules/react/dist/JSXTransformer.js:238:9)
            at result.<computed>.async (http://localhost:8888/node_modules/react/dist/JSXTransformer.js:273:9)
            at XMLHttpRequest.xhr.onreadystatechange (http://localhost:8888/node_modules/react/dist/JSXTransformer.js:208:9)
        From previous event:
            at run (cypress:///../driver/src/cypress/cy.js:561:21)
            at $Cy.cy.<computed> [as visit] (cypress:///../driver/src/cypress/cy.js:1018:11)
            at Context.runnable.fn (cypress:///../driver/src/cypress/cy.js:1242:21)
            at callFn (cypress:///../driver/node_modules/mocha/lib/runnable.js:395:21)
            at Test.Runnable.run (cypress:///../driver/node_modules/mocha/lib/runnable.js:382:7)
            at eval (cypress:///../driver/src/cypress/runner.js:1249:28)
        From previous event:
            at Object.onRunnableRun (cypress:///../driver/src/cypress/runner.js:1237:17)
            at $Cypress.action (cypress:///../driver/src/cypress.js:397:28)
            at Test.Runnable.run (cypress:///../driver/src/cypress/mocha.js:348:13)
            at Runner.runTest (cypress:///../driver/node_modules/mocha/lib/runner.js:541:10)
            at eval (cypress:///../driver/node_modules/mocha/lib/runner.js:667:12)
            at next (cypress:///../driver/node_modules/mocha/lib/runner.js:450:14)
            at eval (cypress:///../driver/node_modules/mocha/lib/runner.js:460:7)
            at next (cypress:///../driver/node_modules/mocha/lib/runner.js:362:14)
            at eval (cypress:///../driver/node_modules/mocha/lib/runner.js:428:5)
            at timeslice (cypress:///../driver/node_modules/mocha/browser-entry.js:80:27)
      `

      const projectRoot = '/Users/gleb/git/cypress-example-todomvc'
      const details = $stackUtils.getSourceDetailsForFirstLine(stack, projectRoot)

      expect(details, 'minimal details').to.deep.equal({
        absoluteFile: undefined,
        column: 1,
        fileUrl: undefined,
        function: '<unknown>',
        line: 1,
        originalFile: undefined,
        relativeFile: undefined,
        whitespace: '            ',
      })
    })

    // https://github.com/cypress-io/cypress/issues/14659
    it('parses stack trace with special characters', () => {
      cy.stub($sourceMapUtils, 'getSourcePosition').returns({
        file: 'webpack:///cypress/integration/spec%with%20space%20&^$%20emoji%F0%9F%91%8D_%E4%BD%A0%E5%A5%BD.js',
        line: 1,
        column: 0,
      })

      // stack is fairly irrelevant in this test - testing transforming getSourcePosition response
      const stack = `
        Error
          at Object../cypress/integration/spec%with space &^$ emoji👍_你好.js (http://localhost:50129/__cypress/tests?p=cypress/integration/spec%25with%20space%20%26^$%20emoji👍_你好.js:99:1)
      `

      const projectRoot = '/Users/gleb/git/cypress-example-todomvc'
      const details = $stackUtils.getSourceDetailsForFirstLine(stack, projectRoot)

      expect(details.originalFile).to.equal('webpack:///cypress/integration/spec%with space &^$ emoji👍_你好.js')
      expect(details.relativeFile).to.equal('cypress/integration/spec%with space &^$ emoji👍_你好.js')
      expect(details.absoluteFile).to.equal(`${projectRoot}/cypress/integration/spec%with space &^$ emoji👍_你好.js`)
    })

    it('maintains absolute path when provided', () => {
      cy.stub($sourceMapUtils, 'getSourcePosition').returns({
        file: '/root/path/cypress/integration/spec.js',
        line: 1,
        column: 0,
      })

      // stack is fairly irrelevant in this test - testing transforming getSourcePosition response
      const stack = `
        Error
          at Object../cypress/integration/spec.js (http://localhost:50129/__cypress/tests?p=/root/path/cypress/integration/spec.js:99:1)
      `

      const projectRoot = '/Users/gleb/git/cypress-example-todomvc'
      const details = $stackUtils.getSourceDetailsForFirstLine(stack, projectRoot)

      expect(details.originalFile).to.equal('/root/path/cypress/integration/spec.js')
      expect(details.relativeFile).to.equal('/root/path/cypress/integration/spec.js')
      expect(details.absoluteFile).to.equal(`/root/path/cypress/integration/spec.js`)
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
