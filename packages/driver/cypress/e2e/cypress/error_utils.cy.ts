import { allowTsModuleStubbing } from '../../support/helpers'

allowTsModuleStubbing()

import $stackUtils from '../../../src/cypress/stack_utils'
import $errUtils, { CypressError } from '../../../src/cypress/error_utils'
import $errorMessages from '../../../src/cypress/error_messages'

const { sinon } = Cypress

describe('driver/src/cypress/error_utils', () => {
  context('.modifyErrMsg', () => {
    let originalErr
    let newErrMsg
    let modifier

    beforeEach(() => {
      originalErr = new Error('simple foo message')
      originalErr.name = 'FooError'
      newErrMsg = 'new message'
      modifier = (msg1, msg2) => `${msg2} ${msg1}`
    })

    it('returns new error object with message modified by callback', () => {
      const err = $errUtils.modifyErrMsg(originalErr, newErrMsg, modifier)

      expect(err.name).to.eq('FooError')
      expect(err.message).to.eq('new message simple foo message')
    })

    it('replaces stack error message', () => {
      originalErr.stack = `${originalErr.name}: ${originalErr.message}\nline 2\nline 3`
      const err = $errUtils.modifyErrMsg(originalErr, newErrMsg, modifier)

      expect(err.stack).to.equal('FooError: new message simple foo message\nline 2\nline 3')
    })

    it('keeps other properties in place from original error', () => {
      originalErr.actual = 'foo'
      originalErr.expected = 'bar'
      const err = $errUtils.modifyErrMsg(originalErr, newErrMsg, modifier)

      expect(err.actual).to.equal('foo')
      expect(err.expected).to.equal('bar')
    })
  })

  context('.throwErr', () => {
    it('throws error as a cypress error when it is a message string', () => {
      const fn = () => {
        $errUtils.throwErr('Something unexpected')
      }

      expect(fn).to.throw().and.satisfy((err) => {
        expect(err.message).to.equal('Something unexpected')
        expect(err.name).to.eq('CypressError')

        return true
      })
    })

    it('throws error when it is an object', () => {
      const fn = () => {
        $errUtils.throwErr({ name: 'SomeError', message: 'Something unexpected', extraProp: 'extra prop' })
      }

      expect(fn).to.throw().and.satisfy((err) => {
        expect(err.message).to.equal('Something unexpected')
        expect(err.name).to.eq('SomeError')
        expect(err.extraProp).to.eq('extra prop')

        return true
      })
    })

    it('throws error when it is an error', () => {
      const err = new Error('Something unexpected')

      // @ts-ignore
      err.extraProp = 'extra prop'
      const fn = () => {
        $errUtils.throwErr(err)
      }

      expect(fn).to.throw().and.satisfy((err) => {
        expect(err.message).to.equal('Something unexpected')
        expect(err.name).to.eq('Error')
        expect(err.extraProp).to.eq('extra prop')

        return true
      })
    })

    it('attaches onFail to the error when it is a function', () => {
      const onFail = function () { }
      const fn = () => $errUtils.throwErr(new Error('foo'), { onFail })

      expect(fn).throw().and.satisfy((err) => {
        expect(err.onFail).to.equal(onFail)

        return true
      })
    })

    it('attaches onFail to the error when it is a command', () => {
      const command = { error: cy.spy() }
      const fn = () => $errUtils.throwErr(new Error('foo'), { onFail: command })

      expect(fn).throw().and.satisfy((err) => {
        err.onFail('the error')

        expect(command.error).to.be.calledWith('the error')

        return true
      })
    })
  })

  context('.errByPath', () => {
    beforeEach(() => {
      // @ts-ignore
      $errorMessages.__test_errors = {
        obj: {
          message: 'This is a simple error message',
          docsUrl: 'https://on.link.io',
        },
        obj_with_args: {
          message: `This has args like '{{foo}}' and {{bar}}`,
          docsUrl: 'https://on.link.io',
        },
        obj_with_multi_args: {
          message: `This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice`,
          docsUrl: 'https://on.link.io',
        },
        obj_with_markdown: {
          message: 'This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_',
          docsUrl: 'https://on.link.io',
        },
        str: 'This is a simple error message',
        str_with_args: `This has args like '{{foo}}' and {{bar}}`,
        str_with_multi_args: `This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice`,
        str_with_markdown: 'This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_',
        fn () {
          return 'This is a simple error message'
        },
        fn_with_args (obj) {
          return `This has args like '${obj.foo}' and ${obj.bar}`
        },
        fn_with_multi_args (obj) {
          return `This has args like '${obj.foo}' and ${obj.bar}, and '${obj.foo}' is used twice`
        },
        fn_with_markdown (obj) {
          return `This has markdown like \`${obj.foo}\`, *${obj.bar}*, **${obj.foo}**, and _${obj.bar}_`
        },
        fn_returns_obj: () => {
          return {
            message: 'This is a simple error message',
            docsUrl: 'https://on.link.io',
          }
        },
        fn_returns_obj_with_args: (obj) => {
          return {
            message: `This has args like '${obj.foo}' and ${obj.bar}`,
            docsUrl: 'https://on.link.io',
          }
        },
        fn_returns_obj_with_multi_args: (obj) => {
          return {
            message: `This has args like '${obj.foo}' and ${obj.bar}, and '${obj.foo}' is used twice`,
            docsUrl: 'https://on.link.io',
          }
        },
        fn_returns_obj_with_markdown: (obj) => {
          return {
            message: `This has markdown like \`${obj.foo}\`, *${obj.bar}*, **${obj.foo}**, and _${obj.bar}_`,
            docsUrl: 'https://on.link.io',
          }
        },
      }
    })

    it('returns internal error when message path does not exist', () => {
      const err = $errUtils.errByPath('not.there')

      expect(err.name).to.eq('InternalCypressError')
      expect(err.message).to.include(`Error message path 'not.there' does not exist`)
    })

    describe('when message value is an object', () => {
      it('has correct name, message, and docs url when path exists', () => {
        const err = $errUtils.errByPath('__test_errors.obj') as CypressError

        expect(err.name).to.eq('CypressError')
        expect(err.message).to.include('This is a simple error message')
        expect(err.docsUrl).to.include('https://on.link.io')
      })

      it('uses args provided for the error', () => {
        const err = $errUtils.errByPath('__test_errors.obj_with_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        }) as CypressError

        expect(err.message).to.include('This has args like \'foo\' and bar,qux')
        expect(err.docsUrl).to.include('https://on.link.io')
      })

      it('handles args being used multiple times in message', () => {
        const err = $errUtils.errByPath('__test_errors.obj_with_multi_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        }) as CypressError

        expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')
        expect(err.docsUrl).to.include('https://on.link.io')
      })

      it('formats markdown in the error message', () => {
        const err = $errUtils.errByPath('__test_errors.obj_with_markdown', {
          foo: 'foo', bar: ['bar', 'qux'],
        }) as CypressError

        expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')
        expect(err.docsUrl).to.include('https://on.link.io')
      })
    })

    describe('when message value is a string', () => {
      it('has correct name, message, and docs url', () => {
        const err = $errUtils.errByPath('__test_errors.str') as CypressError

        expect(err.name).to.eq('CypressError')
        expect(err.message).to.include('This is a simple error message')
        expect(err.docsUrl).to.be.undefined
      })

      it('uses args provided for the error', () => {
        const err = $errUtils.errByPath('__test_errors.str_with_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include('This has args like \'foo\' and bar,qux')
      })

      it('handles args being used multiple times in message', () => {
        const err = $errUtils.errByPath('__test_errors.str_with_multi_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include(`This has args like 'foo' and bar,qux, and 'foo' is used twice`)
      })

      it('formats markdown in the error message', () => {
        const err = $errUtils.errByPath('__test_errors.str_with_markdown', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')
      })
    })

    describe('when message value is a function that returns a string', () => {
      it('has correct name and message', () => {
        const err = $errUtils.errByPath('__test_errors.fn')

        expect(err.name).to.eq('CypressError')
        expect(err.message).to.include('This is a simple error message')

        return true
      })

      it('uses args in the error message', () => {
        const err = $errUtils.errByPath('__test_errors.fn_with_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include('This has args like \'foo\' and bar,qux')
      })

      it('handles args being used multiple times in message', () => {
        const err = $errUtils.errByPath('__test_errors.fn_with_multi_args', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')
      })

      it('formats markdown in the error message', () => {
        const err = $errUtils.errByPath('__test_errors.fn_with_markdown', {
          foo: 'foo', bar: ['bar', 'qux'],
        })

        expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')
      })
    })

    describe('when message value is a function that returns an object', () => {
      describe('when no args are provided for the error', () => {
        it('has an err.name of CypressError', () => {
          const err = $errUtils.errByPath('__test_errors.fn_returns_obj')

          expect(err.name).to.eq('CypressError')
        })

        it('has the right message and docs url', () => {
          const err = $errUtils.errByPath('__test_errors.fn_returns_obj') as CypressError

          expect(err.message).to.include('This is a simple error message')
          expect(err.docsUrl).to.include('https://on.link.io')
        })
      })

      describe('when args are provided for the error', () => {
        it('uses them in the error message', () => {
          const err = $errUtils.errByPath('__test_errors.fn_returns_obj_with_args', {
            foo: 'foo', bar: ['bar', 'qux'],
          }) as CypressError

          expect(err.message).to.include('This has args like \'foo\' and bar,qux')
          expect(err.docsUrl).to.include('https://on.link.io')
        })
      })

      describe('when args are provided for the error and some are used multiple times in message', () => {
        it('uses them in the error message', () => {
          const err = $errUtils.errByPath('__test_errors.fn_returns_obj_with_multi_args', {
            foo: 'foo', bar: ['bar', 'qux'],
          }) as CypressError

          expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')
          expect(err.docsUrl).to.include('https://on.link.io')
        })
      })
    })
  })

  context('.throwErrByPath', () => {
    let fn

    beforeEach(() => {
      // @ts-ignore
      $errorMessages.__test_errors = {
        test: 'Simple error {{message}}',
      }

      // build up a little stack
      const throwingFn = () => {
        $errUtils.throwErrByPath('__test_errors.test', {
          args: { message: 'with a message' },
        })
      }

      fn = () => throwingFn()
    })

    it('looks up error and throws it', () => {
      expect(fn).to.throw('Simple error with a message')
    })

    // TODO(webkit): fix+unskip for experimental webkit
    it('removes internal stack lines from stack', { browser: '!webkit' }, () => {
      // this features relies on Error.captureStackTrace, which some
      // browsers don't have (e.g. Firefox)
      if (!Error.captureStackTrace) return

      expect(fn).to.throw().and.satisfies((err) => {
        expect(err.stack).to.include('throwingFn')
        expect(err.stack).not.to.include('throwErrByPath')
        expect(err.stack).not.to.include('errByPath')
        expect(err.stack).not.to.include('cypressErr')

        return true
      })
    })
  })

  context('.enhanceStack', () => {
    const userInvocationStack = '  at userInvoked (app.js:1:1)'
    const sourceStack = {
      sourceMapped: 'source mapped stack',
      parsed: [],
    }
    const codeFrame = {}
    let err

    beforeEach(() => {
      $stackUtils.replacedStack = cy.stub().returns('replaced stack')
      $stackUtils.getSourceStack = cy.stub().returns(sourceStack)
      $stackUtils.getCodeFrame = cy.stub().returns(codeFrame)

      err = { stack: 'Error: original stack message\n at originalStack (foo.js:1:1)' }
    })

    it('replaces stack with source map stack', () => {
      const result = $errUtils.enhanceStack({ err, userInvocationStack })

      expect(result.stack).to.equal(sourceStack.sourceMapped)
    })

    it('attaches parsed stack', () => {
      const result = $errUtils.enhanceStack({ err, userInvocationStack })

      expect(result.parsedStack).to.equal(sourceStack.parsed)
    })

    it('attaches code frame', () => {
      const result = $errUtils.enhanceStack({ err, userInvocationStack })

      expect(result.codeFrame).to.equal(codeFrame)
    })

    it('appends user invocation stack when it is a cypress error', () => {
      err.name = 'CypressError'

      cy.spy($stackUtils, 'stackWithUserInvocationStackSpliced')
      $errUtils.enhanceStack({ err, userInvocationStack })
      expect($stackUtils.stackWithUserInvocationStackSpliced).to.be.called
    })

    it('appends user invocation stack when it is a chai validation error', () => {
      err.message = 'Invalid Chai property'
      cy.spy($stackUtils, 'stackWithUserInvocationStackSpliced')
      $errUtils.enhanceStack({ err, userInvocationStack })
      expect($stackUtils.stackWithUserInvocationStackSpliced).to.be.called
    })

    it('does not replaced or append stack when there is no invocation stack', () => {
      const result = $errUtils.enhanceStack({ err })

      expect(result.stack).to.equal(err.stack)
    })
  })

  context('.appendErrMsg', () => {
    it('replaces old stack message with new one', () => {
      const err = new Error('old message')
      const newErr = $errUtils.appendErrMsg(err, 'new message')

      expect(newErr.message).to.equal('old message\n\nnew message')
      expect(newErr.stack).to.include('Error: old message\n\nnew message\n')
    })

    it('properly replaces stack message when error has no message', () => {
      const err = new Error()
      const newErr = $errUtils.appendErrMsg(err, 'new message')

      expect(newErr.message).to.equal('new message')
      expect(newErr.stack).to.include('Error: new message\n')
      expect(newErr.stack).not.to.include('\nError')
    })
  })

  context('.createUncaughtException', () => {
    let err
    let state

    beforeEach(() => {
      err = new Error('original message')
      err.stack = 'Error: original message\n\nat foo (path/to/file:1:1)'

      state = cy.stub()
    })

    it('mutates the error passed in and returns it', () => {
      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      expect(result).to.equal(err)
    })

    it('replaces message with wrapper message for spec error', () => {
      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      expect(result.message).to.include('The following error originated from your test code, not from Cypress')
      expect(result.message).to.include('> original message')
    })

    it('replaces message with wrapper message for app error', () => {
      const result = $errUtils.createUncaughtException({
        frameType: 'app',
        handlerType: 'error',
        state,
        err,
      })

      expect(result.message).to.include('The following error originated from your application code, not from Cypress')
      expect(result.message).to.include('> original message')
    })

    it('replaces original name and message in stack', () => {
      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      expect(result.stack).not.to.include('Error: original message')
    })

    it('retains the stack of the original error', () => {
      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      expect(result.stack).to.include('at foo (path/to/file:1:1)')
    })

    it('adds docsUrl for app error and original error', () => {
      err.docsUrl = 'https://on.cypress.io/orginal-error-docs-url'

      const result = $errUtils.createUncaughtException({
        frameType: 'app',
        handlerType: 'error',
        state,
        err,
      })

      expect(result.docsUrl).to.eql([
        'https://on.cypress.io/uncaught-exception-from-application',
        'https://on.cypress.io/orginal-error-docs-url',
      ])
    })

    it('logs error with onFail fn when logs exists', () => {
      const errorStub = cy.stub()

      state.returns({
        getLastLog: () => ({ error: errorStub }),
      })

      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      result.onFail()
      expect(errorStub).to.be.calledWith(result)
    })

    it('does not error if no last log', () => {
      state.returns({
        getLastLog: () => { },
      })

      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      result.onFail()
      // expect no error
    })

    it('does not error if no current command', () => {
      state.returns(undefined)

      const result = $errUtils.createUncaughtException({
        frameType: 'spec',
        handlerType: 'error',
        state,
        err,
      })

      result.onFail()
      // expect no error
    })
  })

  context('Error.captureStackTrace', () => {
    // TODO(webkit): fix+unskip for experimental webkit
    it('works - even where not natively support', { browser: '!webkit' }, () => {
      function removeMe2 () {
        const err: Record<string, any> = {}

        Error.captureStackTrace(err, removeMeAndAbove)

        return err
      }
      function removeMe1 () {
        return removeMe2()
      }
      function removeMeAndAbove () {
        return removeMe1()
      }
      function dontRemoveMe () {
        return removeMeAndAbove()
      }

      const stack = dontRemoveMe().stack

      expect(stack).to.include('dontRemoveMe')
      expect(stack).not.to.include('removeMe1')
      expect(stack).not.to.include('removeMe2')
      expect(stack).not.to.include('removeMeAndAbove')
    })
  })

  context('.wrapErr', () => {
    [
      { value: undefined, label: 'undefined' },
      { value: null, label: 'null' },
      { value: '', label: 'empty string' },
      { value: true, label: 'boolean' },
      { value: 1, label: 'number' },
    ].forEach((err) => {
      it(`returns undefined if err is ${err.label}`, () => {
        expect($errUtils.wrapErr(err.value)).to.be.undefined
      })
    })
  })

  context('.getUnsupportedPlugin', () => {
    it('returns unsupported plugin if the error msg is the expected one', () => {
      const unsupportedPlugin = $errUtils.getUnsupportedPlugin({
        invocationDetails: {
          originalFile: 'node_modules/@cypress/code-coverage',
        },
        err: {
          message: 'glob pattern string required',
        },
      })

      expect(unsupportedPlugin).to.eq('@cypress/code-coverage')
    })

    it('returns null if the error msg is not the expected one', () => {
      const unsupportedPlugin = $errUtils.getUnsupportedPlugin({
        invocationDetails: {
          originalFile: 'node_modules/@cypress/code-coverage',
        },
        err: {
          message: 'random error msg',
        },
      })

      expect(unsupportedPlugin).to.eq(null)
    })
  })

  context('.logError', () => {
    let cypressMock

    beforeEach(() => {
      cypressMock = {
        log: cy.stub(),
      }
    })

    it('calls Cypress.log with error name and message when error is instance of Error', () => {
      $errUtils.logError(cypressMock, 'error', new Error('Some error'))
      expect(cypressMock.log).to.have.been.calledWithMatch(sinon.match.has('message', `Error: Some error`))
    })

    it('calls Cypress.log with error name and message when error a string', () => {
      $errUtils.logError(cypressMock, 'error', 'Some string error')
      expect(cypressMock.log).to.have.been.calledWithMatch(sinon.match.has('message', `Error: \"Some string error\"`))
    })

    it('calls Cypress.log with default error name and provided message message when error is an object with a message', () => {
      $errUtils.logError(cypressMock, 'error', { message: 'Some object error with message' })
      expect(cypressMock.log).to.have.been.calledWithMatch(sinon.match.has('message', `Error: Some object error with message`))
    })

    it('calls Cypress.log with error name and message when error is an object', () => {
      $errUtils.logError(cypressMock, 'error', { err: 'Error details' })
      expect(cypressMock.log).to.have.been.calledWithMatch(sinon.match.has('message', `Error: {"err":"Error details"}`))
    })
  })
})
