import $stackUtils from '../../../src/cypress/stack_utils'
import $sourceMapUtils from '../../../src/cypress/source_map_utils'

describe('stack_utils getInvocationDetails', () => {
  context('basic test invocation', () => {
    it('correctly extracts invocation details for Chrome', { browser: 'chrome' }, function () {
      // Chrome stack traces for test invocations start with 'at eval' or 'at Suite.eval'
      const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

      expect(details).to.exist
      expect(details.line).to.be.a('number')
      expect(details.column).to.be.a('number')
      expect(details.stack).to.be.a('string')

      // Verify the stack is trimmed to start with the test invocation
      // Chrome format: "at eval" or "at Suite.eval"
      const stackLines = details.stack.split('\n')
      const firstStackLine = stackLines.find((line) => line.trim().startsWith('at'))

      expect(firstStackLine).to.exist
      expect(firstStackLine.trim()).to.satisfy((line: string) => {
        return line.startsWith('at eval') || line.startsWith('at Suite.eval')
      }, 'Chrome stack should start with "at eval" or "at Suite.eval"')

      // Verify that the stack was actually trimmed (should not include Cypress internals before the test invocation)
      // The trimmed stack should start with the test invocation pattern, not internal Cypress code
      const hasCypressInternalBeforeInvocation = stackLines.some((line, index) => {
        const trimmedLine = line.trim()

        return index < stackLines.indexOf(firstStackLine) &&
          (trimmedLine.includes('cypress:///../driver/src/cypress/runner.ts') ||
           trimmedLine.includes('cypress:///../driver/src/cypress/mocha.ts'))
      })

      expect(hasCypressInternalBeforeInvocation).to.be.false
    })

    it('correctly extracts invocation details for Firefox', { browser: 'firefox' }, function () {
      // Firefox stack traces for test invocations have no function name before '@'
      // Format: "@http://localhost:3000/__cypress/tests?p=..."
      const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

      expect(details).to.exist
      expect(details.line).to.be.a('number')
      expect(details.column).to.be.a('number')
      expect(details.stack).to.be.a('string')

      // Verify the stack is trimmed to start with the test invocation
      // Firefox format: "@" with empty function name before it
      const stackLines = details.stack.split('\n')
      const firstStackLine = stackLines.find((line) => line.includes('@'))

      expect(firstStackLine).to.exist
      const splitAtAt = firstStackLine.split('@')

      expect(splitAtAt.length).to.be.greaterThan(1)
      expect(splitAtAt[0].trim()).to.equal('', 'Firefox stack should have empty function name before @')

      // Verify that the stack was actually trimmed (should not include Cypress internals before the test invocation)
      const hasCypressInternalBeforeInvocation = stackLines.some((line, index) => {
        return index < stackLines.indexOf(firstStackLine) &&
          (line.includes('cypress:///../driver/src/cypress/runner.ts') ||
           line.includes('cypress:///../driver/src/cypress/mocha.ts'))
      })

      expect(hasCypressInternalBeforeInvocation).to.be.false
    })
  })

  context('wrapped it function', () => {
    // Test case for when users re-define Mocha's it function
    // This creates additional stack frames that need to be trimmed correctly
    function myIt (name: string, optionsOrFn: any, fn?: () => void) {
      if (fn) {
        it(name, optionsOrFn, fn)
      } else {
        it(name, optionsOrFn)
      }
    }

    myIt('correctly extracts invocation details for wrapped it in Chrome', { browser: 'chrome' }, function () {
      const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

      expect(details).to.exist
      expect(details.line).to.be.a('number')
      expect(details.column).to.be.a('number')

      // The stack should be trimmed to the actual test invocation (myIt call)
      // not the wrapper function call
      const stackLines = details.stack.split('\n')
      const firstStackLine = stackLines.find((line) => line.trim().startsWith('at'))

      expect(firstStackLine).to.exist
      expect(firstStackLine.trim()).to.satisfy((line: string) => {
        return line.startsWith('at eval') || line.startsWith('at Suite.eval')
      }, 'Chrome stack should start with "at eval" or "at Suite.eval" even with wrapped it')
    })

    myIt('correctly extracts invocation details for wrapped it in Firefox', { browser: 'firefox' }, function () {
      const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

      expect(details).to.exist
      expect(details.line).to.be.a('number')
      expect(details.column).to.be.a('number')

      // The stack should be trimmed to the actual test invocation
      const stackLines = details.stack.split('\n')
      const firstStackLine = stackLines.find((line) => line.includes('@'))

      expect(firstStackLine).to.exist
      const splitAtAt = firstStackLine.split('@')

      expect(splitAtAt.length).to.be.greaterThan(1)
      expect(splitAtAt[0].trim()).to.equal('', 'Firefox stack should have empty function name before @ even with wrapped it')
    })
  })

  context('nested describes', () => {
    describe('outer describe', () => {
      describe('inner describe', () => {
        it('correctly extracts invocation details in nested describe for Chrome', { browser: 'chrome' }, function () {
          const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

          expect(details).to.exist
          expect(details.line).to.be.a('number')
          expect(details.column).to.be.a('number')

          // Stack should still be trimmed correctly even in nested describes
          const firstStackLine = details.stack.split('\n').find((line) => line.trim().startsWith('at'))

          expect(firstStackLine).to.exist
          expect(firstStackLine.trim()).to.satisfy((line: string) => {
            return line.startsWith('at eval') || line.startsWith('at Suite.eval')
          }, 'Chrome stack should start with "at eval" or "at Suite.eval" in nested describes')
        })

        it('correctly extracts invocation details in nested describe for Firefox', { browser: 'firefox' }, function () {
          const details = $stackUtils.getInvocationDetails(window, $sourceMapUtils.getSourceMapProjectRoot(), 'test')

          expect(details).to.exist
          expect(details.line).to.be.a('number')
          expect(details.column).to.be.a('number')

          // Stack should still be trimmed correctly even in nested describes
          const stackLines = details.stack.split('\n')
          const firstStackLine = stackLines.find((line) => line.includes('@'))

          expect(firstStackLine).to.exist
          const splitAtAt = firstStackLine.split('@')

          expect(splitAtAt.length).to.be.greaterThan(1)
          expect(splitAtAt[0].trim()).to.equal('', 'Firefox stack should have empty function name before @ in nested describes')
        })
      })
    })
  })
})
