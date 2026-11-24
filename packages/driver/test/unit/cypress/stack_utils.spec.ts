/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import sinon from 'sinon'

import source_map_utils from '../../../src/cypress/source_map_utils'
import stack_utils from '../../../src/cypress/stack_utils'
import stackFrameFixture from './__fixtures__/getInvocationDetails_spec_stackframes.json'
import userInvocationStackFixture from './__fixtures__/getUserInvocationStack_stackFrames.json'
import webkitStackFixture from './__fixtures__/webkit_stackframes.json'
import type { Browser } from '@packages/types'

vi.mock('../../../src/cypress/source_map_utils', () => {
  return {
    default: {
      getSourcePosition: vi.fn(),
    },
  }
})

describe('stack_utils', () => {
  beforeEach(() => {
    // @ts-expect-error - partial Cypress mock
    global.Cypress = {
      config: vi.fn(),
      isBrowser: vi.fn(() => true),
      testingType: 'e2e',
    }

    vi.resetAllMocks()
  })

  describe('getInvocationDetails', () => {
    const { line, column, scenarios } = stackFrameFixture

    const projectRoot = '/foo/bar'

    let stack: string

    class MockError {
      get stack () {
        return stack
      }
    }
    const config = projectRoot

    for (const scenario of scenarios) {
      const { browser, build, specFrame, stack: scenarioStack } = scenario

      describe(`${browser}:${build}`, () => {
        beforeEach(() => {
          stack = scenarioStack
        })

        it('calls getSourcePosition with the correct file, line, and column', () => {
          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: {} },
            config,
          )

          // getSourcePosition is not called directly from getInvocationDetails, but via:
          // - getSourceDetailsForFirstLine
          // - getSourceDetailsForLine
          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith(specFrame, expect.objectContaining({
            column,
            line,
            file: specFrame,
          }))
        })
      })
    }

    describe('stack trimming', () => {
      let CypressWindow: Partial<Cypress.Cypress>

      describe('chromium', () => {
        beforeEach(() => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'chromium') as any,
            testingType: 'e2e',
          }
        })

        it('returns the correct invocation details for a test stack trace that needs to be trimmed', () => {
          const stack = `Error
    at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
    at eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:14:1)
    at eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:18:12)
    at eval (<anonymous>)
    at eval (cypress:///../driver/src/cypress/script_utils.ts:38:23)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js', expect.objectContaining({
            column: 1,
            line: 14,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js',
          }))
        })

        it('does not trim component testing stack traces', () => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'chromium') as any,
            testingType: 'component',
          }

          const stack = `Error
            at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
            at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
            at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
            at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
            at Suite.eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          // calls `getSourcePosition` with the top line of the stack because it was not modified
          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js', expect.objectContaining({
            column: 14,
            line: 444,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js',
          }))
        })

        it('returns the correct invocation details for a .only test with a stack that needs to be trimmed', () => {
          const stack = `Error
        at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
        at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
        at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
        at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
        at Suite.eval (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js', expect.objectContaining({
            column: 6,
            line: 12,
            file: 'http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js',
          }))
        })

        it('returns the original stack if it cannot be normalized for a test', () => {
          const stack = `Error
        at itGrep (http://localhost:3000/__cypress/tests?p=cypress/support/e2e.js:444:14)
        at context.notIt.only (cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:98:46)
        at createRunnable (cypress:///../driver/src/cypress/mocha.ts:126:31)
        at itGrep.eval [as only] (cypress:///../driver/src/cypress/mocha.ts:187:14)
        at somethingElse (http://localhost:3000/__cypress/tests?p=cypress/e2e/spec.cy.js:12:6)`

          class MockError {
            get stack () {
              return stack
            }
          }

          const result = stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          if (!result) throw new Error('expected invocation details')

          expect(result.stack).toEqual(stack)
        })
      })

      describe('firefox', () => {
        beforeEach(() => {
          CypressWindow = {
            isBrowser: vi.fn(({ family }: Browser) => family === 'firefox') as any,
            testingType: 'e2e',
          }
        })

        it('returns the correct invocation details for a test stack trace that needs to be trimmed', () => {
          const stack = `myIt@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:84:11
          @http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:87:9
          create@cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19
          bddInterface/</context.context@cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27`

          class MockError {
            get stack () {
              return stack
            }
          }

          stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          expect(source_map_utils.getSourcePosition).toHaveBeenCalledWith('http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts', expect.objectContaining({
            column: 9,
            line: 87,
            file: 'http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts',
          }))
        })

        it('returns the original stack if it cannot be normalized for a test', () => {
          // stack does not contain the invocation details that we're looking for, so we should return the original stack
          const stack = `myIt@http://localhost:3500/__cypress/tests?p=cypress/e2e/cypress/stack_utils-invocationDetails.cy.ts:84:11
          create@cypress:///../driver/node_modules/mocha/lib/interfaces/common.js:141:19
          bddInterface/</context.context@cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:42:27`

          class MockError {
            get stack () {
              return stack
            }
          }

          const result = stack_utils.getInvocationDetails(
            { Error: MockError, Cypress: CypressWindow },
            config,
            'test',
          )

          if (!result) throw new Error('expected invocation details')

          expect(result.stack).toEqual(stack)
        })
      })
    })
  })

  describe('normalizedStack', () => {
    describe('webkit', () => {
      beforeEach(() => {
        vi.mocked(Cypress.isBrowser).mockImplementation((browser) => browser === 'webkit')
      })

      const normalize = (message: string, stack: string) => {
        const err = new Error(message)

        err.stack = stack

        return stack_utils.normalizedStack(err)
      }

      it('fills in missing function names and locations', () => {
        expect(normalize('boom', 'foo@http://localhost/a.js:1:2\n@http://localhost/a.js:3:4\nglobal code@\nmap@[native code]')).toEqual(
          'Error: boom\nfoo@http://localhost/a.js:1:2\n<unknown>@http://localhost/a.js:3:4\nglobal code@<unknown>\nmap@[native code]',
        )
      })

      it('removes the CyWebKitError line', () => {
        expect(normalize('boom', '__CyWebKitError@http://localhost/a.js:1:2\nfoo@http://localhost/a.js:3:4')).toEqual(
          'Error: boom\nfoo@http://localhost/a.js:3:4',
        )
      })

      it('splits a line at its last @', () => {
        expect(normalize('boom', 'foo@bar@')).toEqual(
          'Error: boom\nfoo@bar@<unknown>',
        )
      })

      it('normalizes a stack with a very long message line in linear time', () => {
        const message = `expected <body> to contain text 'Noted.', but the text was '${'word '.repeat(30000)}'`
        const stack = `Error: ${message}\nfoo@http://localhost/a.js:1:2`

        const start = performance.now()

        expect(normalize(message, stack)).toEqual(stack)
        expect(performance.now() - start).toBeLessThan(1000)
      })
    })
  })

  describe('getSourceStack', () => {
    const location = 'http://localhost:8080/__cypress/cypress/spec.cy.js:14:16'

    const expectFunctionName = (functionName: string, expected: string) => {
      const { parsed, sourceMapped } = stack_utils.getSourceStack(`${functionName}@${location}`)

      expect(parsed?.[0]).toHaveProperty('function', expected)
      expect(sourceMapped).toBe(`at ${expected} (${location})`)
    }

    // names from the Firefox stacks in __fixtures__
    it.each([
      ['onRunnableRun/<', 'onRunnableRun'],
      ['./cypress/spec.cy.js/</<', './cypress/spec.cy.js'],
      ['__webpack_modules__</create/onRunnableRun/<', '__webpack_modules__</create/onRunnableRun'],
      ['__webpack_modules__</bddInterface/</context.context', '__webpack_modules__</bddInterface/</context.context'],
      ['__webpack_modules__</module.exports/Promise.prototype._resolveFromExecutor/r<', '__webpack_modules__</module.exports/Promise.prototype._resolveFromExecutor/r<'],
      ['__stackReplacementMarker', '__stackReplacementMarker'],
      ['', '<unknown>'],
    ])('names the captured Firefox frame %j as %j', expectFunctionName)

    // forms that follow Firefox's naming rules but are not in the captured stacks
    it.each([
      ['./cypress/spec.cy.js/</</<', './cypress/spec.cy.js'],
      ['onRunnableRun</<', 'onRunnableRun'],
      ['onRunnableRun</</<', 'onRunnableRun'],
      ['/<', '<unknown>'],
      ['/</<', '<unknown>'],
    ])('names the extrapolated Firefox frame %j as %j', expectFunctionName)

    it('names a Chromium frame without Firefox markers', () => {
      const { parsed } = stack_utils.getSourceStack(`    at Context.eval (${location})`)

      expect(parsed?.[0]).toHaveProperty('function', 'Context.eval')
    })

    describe('on captured frames', () => {
      const fixtureLines = new Set([
        ...stackFrameFixture.scenarios,
        ...userInvocationStackFixture.scenarios,
        ...webkitStackFixture.scenarios,
      ].flatMap(({ stack }) => stack.split('\n')))

      // One real frame of each shape the Firefox and WebKit format can take,
      // and a few Chromium frames, which take a different path through the
      // parser. Each row pins what the parser returns for that shape.
      it.each([
        ['Firefox, named, dev build', 'getInvocationDetails@cypress:///../driver/src/cypress/stack_utils.ts:100:17', { function: 'getInvocationDetails', file: 'cypress:///../driver/src/cypress/stack_utils.ts', line: 100, column: 17 }],
        ['Firefox, named, binary', 'getInvocationDetails@http://localhost:3000/__cypress/runner/cypress_runner.js:97344:17', { function: 'getInvocationDetails', file: 'http://localhost:3000/__cypress/runner/cypress_runner.js', line: 97344, column: 17 }],
        ['Firefox, anonymous spec frame with a query string', '@http://localhost:3000/__cypress/tests?p=cypress/tests/some_spec.cy.ts:80:12', { function: '<unknown>', file: 'http://localhost:3000/__cypress/tests?p=cypress/tests/some_spec.cy.ts', line: 80, column: 12 }],
        ['Firefox, anonymous frame in an encoded iframe URL', '@http://localhost:3000/__cypress/iframes/cypress%2Ftests%2Fsome_spec.cy.ts?browserFamily=firefox:80:12', { function: '<unknown>', file: 'http://localhost:3000/__cypress/iframes/cypress%2Ftests%2Fsome_spec.cy.ts?browserFamily=firefox', line: 80, column: 12 }],
        ['Firefox, indented anonymous frame with `@` in its URL', '    @http://localhost:3002/__cypress/src/@fs/cypress/spec.cy.js:14:16', { function: '<unknown>', file: 'http://localhost:3002/__cypress/src/@fs/cypress/spec.cy.js', line: 14, column: 16 }],
        ['Firefox, `/<` marker inside the name', 'bddInterface/</context.specify@cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js:88:13', { function: 'bddInterface/</context.specify', file: 'cypress:///../driver/node_modules/mocha/lib/interfaces/bdd.js', line: 88, column: 13 }],
        ['Firefox, trailing `/<` marker', '__webpack_modules__</overloadMochaFnForConfig/replacementFn/<@http://localhost:3000/__cypress/runner/cypress_runner.js:144333:14', { function: '__webpack_modules__</overloadMochaFnForConfig/replacementFn', file: 'http://localhost:3000/__cypress/runner/cypress_runner.js', line: 144333, column: 14 }],
        ['Firefox, indented, two trailing markers', '    ./cypress/spec.cy.js/</<@http://localhost:8080/__cypress/cypress/spec.cy.js:14:16', { function: './cypress/spec.cy.js', file: 'http://localhost:8080/__cypress/cypress/spec.cy.js', line: 14, column: 16 }],
        ['Firefox, async cause with a space', 'promise callback*schedule@cypress:///../../node_modules/bluebird/js/release/schedule.js:19:23', { function: 'promise callback*schedule', file: 'cypress:///../../node_modules/bluebird/js/release/schedule.js', line: 19, column: 23 }],
        ['Firefox, indented async cause', '    setTimeout handler*Mocha.Runner.immediately@cypress:///../driver/node_modules/mocha/browser-entry.js:97:24', { function: 'setTimeout handler*Mocha.Runner.immediately', file: 'cypress:///../driver/node_modules/mocha/browser-entry.js', line: 97, column: 24 }],
        ['Firefox, async cause with a trailing marker', 'EventHandlerNonNull*fetch/<@cypress:///../driver/src/cypress/network_utils.ts:11:7', { function: 'EventHandlerNonNull*fetch', file: 'cypress:///../driver/src/cypress/network_utils.ts', line: 11, column: 7 }],
        ['Firefox, indented, `[fn]` in the name', '    extend/events.proxyTo/parent[fn]@cypress:///../driver/src/cypress/events.ts:31:31', { function: 'extend/events.proxyTo/parent[fn]', file: 'cypress:///../driver/src/cypress/events.ts', line: 31, column: 31 }],
        ['Firefox, indented stack replacement marker', '    __stackReplacementMarker@cypress:///../driver/src/cypress/cy.ts:85:13', { function: '__stackReplacementMarker', file: 'cypress:///../driver/src/cypress/cy.ts', line: 85, column: 13 }],
        ['Firefox, indented, hashed asset file', '    _runDriver@http://localhost:3002/__/assets/index-DpxbR-dF.js:109253:15', { function: '_runDriver', file: 'http://localhost:3002/__/assets/index-DpxbR-dF.js', line: 109253, column: 15 }],
        ['WebKit, named', 'captureStack@http://localhost:3500/__cypress/tests:10:19', { function: 'captureStack', file: 'http://localhost:3500/__cypress/tests', line: 10, column: 19 }],
        ['WebKit, anonymous', '@http://localhost:3500/__cypress/tests:15:31', { function: '<unknown>', file: 'http://localhost:3500/__cypress/tests', line: 15, column: 31 }],
        ['WebKit, `global code`', 'global code@http://localhost:3500/__cypress/tests:24:45', { function: 'global code', file: 'http://localhost:3500/__cypress/tests', line: 24, column: 45 }],
        ['WebKit, `[native code]`', 'map@[native code]', { function: 'map', file: '[native code]' }],
        ['WebKit, `eval code` with no location', 'eval code@', { message: 'eval code@' }],
        ['Chromium, named', '    at Object.getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts:98:32)', { function: 'Object.getInvocationDetails', file: 'cypress:///../driver/src/cypress/stack_utils.ts', line: 98, column: 32 }],
        ['Chromium, no function name', '    at http://localhost:3000/__cypress/runner/cypress_runner.js:144333:14', { function: '<unknown>', file: 'http://localhost:3000/__cypress/runner/cypress_runner.js', line: 144333, column: 14 }],
        ['Chromium, eval frame', '    at eval (eval at getInvocationDetails (cypress:///../driver/src/cypress/stack_utils.ts), <anonymous>:1:1)', { function: 'eval', file: 'cypress:///../driver/src/cypress/stack_utils.ts' }],
        ['Chromium, `<computed>` and `[as …]`', '    at Suite.<computed> [as beforeEach] (cypress:///../driver/src/cypress/mocha.ts:546:23)', { function: 'Suite.<computed> [as beforeEach]', file: 'cypress:///../driver/src/cypress/mocha.ts', line: 546, column: 23 }],
        ['Chromium, `@` in the URL', '    at Context.<anonymous> (http://localhost:4455/__cypress/src/@fs/private/var/folders/g4/15yxjhzs4bd01m_s6cscgxfw0000gq/T/cy-projects/runner-ct-specs/cypress/test.cy.ts:80:12)', { function: 'Context.<anonymous>', file: 'http://localhost:4455/__cypress/src/@fs/private/var/folders/g4/15yxjhzs4bd01m_s6cscgxfw0000gq/T/cy-projects/runner-ct-specs/cypress/test.cy.ts', line: 80, column: 12 }],
        ['Chromium, eval with no location', 'at eval (<anonymous>)', { message: 'at eval (<anonymous>)' }],
      ])('parses a %s frame', (_shape, line, expected) => {
        expect(fixtureLines).toContain(line)

        const frame = stack_utils.getSourceStack(line).parsed?.[0]

        if (!frame) throw new Error(`no frame parsed from ${line}`)

        expect('message' in frame
          ? { message: frame.message }
          : { function: frame.function, file: frame.fileUrl, line: frame.line, column: frame.column }).toEqual(expected)
      })
    })

    describe('on failed spy assertions', () => {
      // the message @cypress/sinon-chai builds for a failed `calledWith`
      const calledWithFailure = (arg: string) => {
        const beacon = { send (_url: string, _body: string) {} }
        const spy = sinon.spy(beacon, 'send')

        const flushLogs = () => beacon.send('/log', arg)

        flushLogs()

        return spy.printf('expected %n to have been called with arguments %*\n\n    The following calls were made:\n%C', '/log', 'flush')
      }

      const events = (count: number) => {
        return Array.from({ length: count }, (_, i) => {
          return { type: 'ui', message: `Payment form shown at step ${i + 1}`, sessionId: 'c9f1e2a4-7b3d-4e8a-9c61-2f5d8a0b7e13' }
        })
      }
      const cartItems = Array.from({ length: 6 }, (_, i) => `<li class="cart-item" data-sku="sku-${1042 + i}">Item ${i + 1}</li>`).join('')

      // The call list prints each call with the frame it came from, so a call
      // line ends in `:line:column` and is parsed like a stack frame. Each
      // argument is just long enough that a backtracking parser takes seconds:
      // longer ones would hang the run instead of failing it.
      it.each([
        ['JSON', JSON.stringify(events(3))],
        ['HTML', cartItems],
        ['JSON with an email address', JSON.stringify(events(12).map((event, i) => i === 0 ? { ...event, user: 'jane.doe@example.com' } : event))],
      ])('parses a stack whose message lists a call with a %s argument quickly', (_kind, arg) => {
        const message = calledWithFailure(arg)
        const stack = `AssertionError: ${message}\n    at Context.eval (http://localhost:54823/__cypress/tests?p=cypress/spec.cy.js:14:16)`

        expect(message).toContain(`send(/log, ${arg}) at `)

        const start = performance.now()
        const { parsed } = stack_utils.getSourceStack(stack)

        expect(performance.now() - start).toBeLessThan(200)
        expect(parsed?.[0]).toHaveProperty('message', 'AssertionError: expected send to have been called with arguments /log, flush')
        expect(parsed?.[parsed.length - 1]).toMatchObject({ function: 'Context.eval', line: 14, column: 16 })
      })
    })

    it('names a Firefox frame with a long run of markers in linear time', () => {
      const markers = '/<'.repeat(100000)
      // a run of markers that does not end the name is the input that makes
      // a backtracking match quadratic
      const stack = [`${markers}onRunnableRun@${location}`, `./cypress/spec.cy.js${markers}@${location}`].join('\n')

      const start = performance.now()
      const { parsed } = stack_utils.getSourceStack(stack)

      expect(performance.now() - start).toBeLessThan(1000)
      expect(parsed?.[0]).toHaveProperty('function', `${markers}onRunnableRun`)
      expect(parsed?.[1]).toHaveProperty('function', './cypress/spec.cy.js')
    })
  })

  describe('normalizedUserInvocationStack', () => {
    it('should remove cross origin stack lines', () => {
      const userInvocationStack = `    at cy.<computed> [as prompt] (cypress:///../driver/src/cypress/cy.ts:657:86)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)
    at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts:176:42)
    at SpecBridgeCommunicator.eval (cypress:///../driver/src/cross-origin/origin_fn.ts:180:21)`
      const normalizedUserInvocationStack = stack_utils.normalizedUserInvocationStack(userInvocationStack)

      expect(normalizedUserInvocationStack).toEqual(`    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`)
    })
  })

  describe('mergeCrossOriginUserInvocationStack', () => {
    it('should merge line numbers from origin stack into user stack', () => {
      const userInvocationStack = `    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`
      const originUserInvocationStack = `    at Context.eval (http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:14:12)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // The first line should have line number 100 + 657 - 1 = 756, column should remain 86
      expect(result).toContain('    at Context.eval (http://localhost:9500/__cypress/tests?p=cypress/e2e/run/cross-origin.cy.ts:15:16)')
    })

    it('should handle different stack formats and preserve the rest of the stack', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:10:20)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)
    at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts:176:42)
    at SpecBridgeCommunicator.eval (cypress:///../driver/src/cross-origin/origin_fn.ts:180:21)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:5:30)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 5 + 10 - 1 = 14, column should remain 20
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:14:20')
      // Rest of the stack should be preserved
      expect(result).toContain('at eval (eval at invokeOriginFn')
      expect(result).toContain('at invokeOriginFn')
      expect(result).toContain('at SpecBridgeCommunicator.eval')
    })

    it('should handle edge case where origin line is 1', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:3:15)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:1:25)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 1 + 3 - 1 = 3, column should remain 15
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:3:15')
    })

    it('should handle edge case where user line is 1', () => {
      const userInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:1:15)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:2:16)`

      const originUserInvocationStack = `    at cy.<computed> [as click] (cypress:///../driver/src/cypress/cy.ts:5:25)
    at eval (eval at invokeOriginFn (cypress:///../driver/src/cross-origin/origin_fn.ts), <anonymous>:1:10)`

      const result = stack_utils.mergeCrossOriginUserInvocationStack(userInvocationStack, originUserInvocationStack)

      // Line should be 5 + 1 - 1 = 5, column should remain 15
      expect(result).toContain('cypress:///../driver/src/cypress/cy.ts:5:15')
    })
  })
})
