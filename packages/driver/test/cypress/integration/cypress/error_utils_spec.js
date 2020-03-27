const $errUtils = require('../../../../src/cypress/error_utils')
const $stackUtils = require('../../../../src/cypress/stack_utils')
const $errorMessages = require('../../../../src/cypress/error_messages')

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

    it('removes stack if noStackTrace: true', () => {
      const fn = () => {
        $errUtils.throwErr('Something unexpected', { noStackTrace: true })
      }

      expect(fn).to.throw().and.satisfy((err) => {
        expect(err.stack).to.equal('')

        return true
      })
    })
  })

  context('.throwErrByPath', () => {
    beforeEach(() => {
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

    it('has correct name and message when error message path does not exist', () => {
      const fn = () => $errUtils.throwErrByPath('not.there')

      expect(fn).to.throw().and.satisfy((err) => {
        expect(err.name).to.eq('InternalError')
        expect(err.message).to.include(`Error message path 'not.there' does not exist`)

        return true
      })
    })

    describe('when error is an object', () => {
      it('has correct name, message, and docs url when path exists', () => {
        const fn = () => $errUtils.throwErrByPath('__test_errors.obj')

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.name).to.eq('CypressError')
          expect(err.message).to.include('This is a simple error message')
          expect(err.docsUrl).to.include('https://on.link.io')

          return true
        })
      })

      it('uses args provided for the error', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.obj_with_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has args like \'foo\' and bar,qux')
          expect(err.docsUrl).to.include('https://on.link.io')

          return true
        })
      })

      it('handles args being used multiple times in message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.obj_with_multi_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')
          expect(err.docsUrl).to.include('https://on.link.io')

          return true
        })
      })

      it('formats markdown in the error message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.obj_with_markdown', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')
          expect(err.docsUrl).to.include('https://on.link.io')

          return true
        })
      })
    })

    describe('when error is a string', () => {
      it('has correct name, message, and docs url', () => {
        const fn = () => $errUtils.throwErrByPath('__test_errors.str')

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.name).to.eq('CypressError')
          expect(err.message).to.include('This is a simple error message')
          expect(err.docsUrl).to.be.undefined

          return true
        })
      })

      it('uses args provided for the error', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.str_with_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has args like \'foo\' and bar,qux')

          return true
        })
      })

      it('handles args being used multiple times in message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.str_with_multi_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include(`This has args like 'foo' and bar,qux, and 'foo' is used twice`)

          return true
        })
      })

      it('formats markdown in the error message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.str_with_markdown', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')

          return true
        })
      })
    })

    describe('when error is a function that returns a string', () => {
      it('has correct name and message', () => {
        const fn = () => $errUtils.throwErrByPath('__test_errors.fn')

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.name).to.eq('CypressError')
          expect(err.message).to.include('This is a simple error message')

          return true
        })
      })

      it('uses args in the error message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.fn_with_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has args like \'foo\' and bar,qux')

          return true
        })
      })

      it('handles args being used multiple times in message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.fn_with_multi_args', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')

          return true
        })
      })

      it('formats markdown in the error message', () => {
        const fn = () => {
          $errUtils.throwErrByPath('__test_errors.fn_with_markdown', {
            args: {
              foo: 'foo', bar: ['bar', 'qux'],
            },
          })
        }

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.message).to.include('This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_')

          return true
        })
      })
    })

    describe('when error is a function that returns an object', () => {
      describe('when no args are provided for the error', () => {
        it('has an err.name of CypressError', () => {
          const fn = () => $errUtils.throwErrByPath('__test_errors.fn_returns_obj')

          expect(fn).to.throw().and.satisfy((err) => {
            expect(err.name).to.eq('CypressError')

            return true
          })
        })

        it('has the right message and docs url', () => {
          const fn = () => $errUtils.throwErrByPath('__test_errors.fn_returns_obj')

          expect(fn).to.throw().and.satisfy((err) => {
            expect(err.message).to.include('This is a simple error message')
            expect(err.docsUrl).to.include('https://on.link.io')

            return true
          })
        })
      })

      describe('when args are provided for the error', () => {
        it('uses them in the error message', () => {
          const fn = () => {
            $errUtils.throwErrByPath('__test_errors.fn_returns_obj_with_args', {
              args: {
                foo: 'foo', bar: ['bar', 'qux'],
              },
            })
          }

          expect(fn).to.throw().and.satisfy((err) => {
            expect(err.message).to.include('This has args like \'foo\' and bar,qux')
            expect(err.docsUrl).to.include('https://on.link.io')

            return true
          })
        })
      })

      describe('when args are provided for the error and some are used multiple times in message', () => {
        it('uses them in the error message', () => {
          const fn = () => {
            $errUtils.throwErrByPath('__test_errors.fn_returns_obj_with_multi_args', {
              args: {
                foo: 'foo', bar: ['bar', 'qux'],
              },
            })
          }

          expect(fn).to.throw().and.satisfy((err) => {
            expect(err.message).to.include('This has args like \'foo\' and bar,qux, and \'foo\' is used twice')
            expect(err.docsUrl).to.include('https://on.link.io')

            return true
          })
        })
      })
    })

    describe('when onFail is provided as a function', () => {
      it('attaches the function to the error', () => {
        const onFail = function () {}
        const fn = () => $errUtils.throwErrByPath('__test_errors.obj', { onFail })

        expect(fn).to.throw().and.satisfy((err) => {
          expect(err.onFail).to.equal(onFail)

          return true
        })
      })
    })

    describe('when onFail is provided as a command', () => {
      it('attaches the handler to the error', () => {
        const command = { error: cy.spy() }

        const fn = () => $errUtils.throwErrByPath('__test_errors.obj', { onFail: command })

        expect(fn).to.throw().and.satisfy((err) => {
          err.onFail('the error')

          expect(command.error).to.be.calledWith('the error')

          return true
        })
      })
    })
  })

  context('.normalizeMsgNewLines', () => {
    it('removes newlines in excess of 2 newlines', () => {
      const normalizedMsg = $errUtils.normalizeMsgNewLines('one new line\ntwo new lines\n\nthree new lines\n\n\nend')

      expect(normalizedMsg).to.eq('one new line\ntwo new lines\n\nthree new lines\n\nend')
    })
  })

  context('.errObjByPath', () => {
    let errMsgs

    beforeEach(() => {
      errMsgs = {
        command: {
          obj: {
            message: '`{{cmd}}` simple error message',
            docsUrl: 'https://on.cypress.io',
          },
          str: '`{{cmd}}` simple error message',
          fn (obj) {
            return `\`${obj.cmd}\` simple error message`
          },
        },
      }
    })

    it('returns obj when err is object', () => {
      const obj = $errUtils.errObjByPath(errMsgs, 'command.obj', {
        cmd: 'click',
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message',
        docsUrl: 'https://on.cypress.io',
      })
    })

    it('returns obj when err is string', () => {
      const obj = $errUtils.errObjByPath(errMsgs, 'command.str', {
        cmd: 'click',
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message',
      })
    })

    it('returns obj when err is function', () => {
      const obj = $errUtils.errObjByPath(errMsgs, 'command.fn', {
        cmd: 'click',
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message',
      })
    })

    it('does not mutate the error message when it is an object', () => {
      $errUtils.errObjByPath(errMsgs, 'command.obj', {
        cmd: 'click',
      })

      const obj = $errUtils.errObjByPath(errMsgs, 'command.obj', {
        cmd: 'dblclick',
      })

      expect(obj).to.deep.eq({
        docsUrl: 'https://on.cypress.io',
        message: '`dblclick` simple error message',
      })
    })
  })

  context('.getErrMsgWithObjByPath', () => {
    let errMsgs

    beforeEach(() => {
      errMsgs = {
        command: {
          obj: {
            message: '{{cmd}} simple error message',
            docsurl: '',
          },
          str: '{{cmd}} simple error message',
          fn (obj) {
            return `\
${obj.cmd} simple error message\
`
          },
        },
      }
    })

    it('returns the message when err is object', () => {
      const msg = $errUtils.getErrMsgWithObjByPath(errMsgs, 'command.obj', {
        cmd: 'click',
      })

      expect(msg).to.eq('click simple error message')
    })

    it('returns the message when err is string', () => {
      const msg = $errUtils.getErrMsgWithObjByPath(errMsgs, 'command.str', {
        cmd: 'click',
      })

      expect(msg).to.eq('click simple error message')
    })

    it('returns the message when err is function', () => {
      const msg = $errUtils.getErrMsgWithObjByPath(errMsgs, 'command.str', {
        cmd: 'click',
      })

      expect(msg).to.eq('click simple error message')
    })
  })

  context('.getObjValueByPath', () => {
    let obj

    beforeEach(() => {
      obj = {
        foo: 'foo',
        bar: {
          baz: {
            qux: 'qux',
          },
        },
      }
    })

    it('throws if object not provided as first argument', () => {
      const fn = () => {
        return $errUtils.getObjValueByPath('foo')
      }

      expect(fn).to.throw('The first parameter to utils.getObjValueByPath() must be an object')
    })

    it('throws if path not provided as second argument', () => {
      const fn = () => {
        return $errUtils.getObjValueByPath(obj)
      }

      expect(fn).to.throw('The second parameter to utils.getObjValueByPath() must be a string')
    })

    it('returns value for shallow path', () => {
      const objVal = $errUtils.getObjValueByPath(obj, 'foo')

      expect(objVal).to.equal('foo')
    })

    it('returns value for deeper path', () => {
      const objVal = $errUtils.getObjValueByPath(obj, 'bar.baz.qux')

      expect(objVal).to.equal('qux')
    })

    it('returns undefined for non-existent shallow path', () => {
      const objVal = $errUtils.getObjValueByPath(obj, 'nope')

      expect(objVal).to.be.undefined
    })

    it('returns undefined for non-existent deeper path', () => {
      const objVal = $errUtils.getObjValueByPath(obj, 'bar.baz.nope')

      expect(objVal).to.be.undefined
    })
  })

  context('.enhanceStack', () => {
    const err = {}
    const invocationStack = 'the stack'
    const sourceStack = {
      sourceMapped: 'source mapped stack',
      parsed: [],
    }
    const codeFrame = {}
    let result

    beforeEach(() => {
      cy.stub($stackUtils, 'replaceStack').returns({ stack: 'new stack' })
      cy.stub($stackUtils, 'getSourceStack').returns(sourceStack)
      cy.stub($stackUtils, 'getCodeFrame').returns(codeFrame)

      result = $errUtils.enhanceStack({ err, invocationStack })
    })

    it('combines error message and stack', () => {
      expect(result.stack).to.equal('new stack')
    })

    it('attaches source mapped stack', () => {
      expect(result.sourceMappedStack).to.equal(sourceStack.sourceMapped)
    })

    it('attaches parsed stack', () => {
      expect(result.parsedStack).to.equal(sourceStack.parsed)
    })

    it('attaches code frame', () => {
      expect(result.codeFrame).to.equal(codeFrame)
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
})
