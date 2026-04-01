import type Sinon from 'sinon'
import type { expect as Expect } from 'chai'
import { SupportedKey, NamedKeys, toSupportedKey, SpaceKey } from '@packages/types'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp_automation'
import { cdpKeyPress, bidiKeyPress, BidiOverrideCodepoints } from '../../../../lib/automation/commands/key_press'
import { Client as WebdriverClient } from 'webdriver'
import type { Protocol } from 'devtools-protocol'
const { expect, sinon }: { expect: typeof Expect, sinon: Sinon.SinonSandbox } = require('../../../spec_helper')

type ClientParams<T extends keyof WebdriverClient> = WebdriverClient[T] extends (...args: any[]) => any ?
  Parameters<WebdriverClient[T]> :
  never

type ClientReturn<T extends keyof WebdriverClient> = WebdriverClient[T] extends (...args: any[]) => any ?
  ReturnType<WebdriverClient[T]> :
  never

describe('key:press automation command', () => {
  const tab: SupportedKey = toSupportedKey('Tab')

  function stubClientMethod<T extends keyof WebdriverClient> (method: T) {
    return sinon.stub<ClientParams<T>, ClientReturn<T>>()
  }

  describe('cdp', () => {
    let sendFn: Sinon.SinonStub<Parameters<SendDebuggerCommand>, ReturnType<SendDebuggerCommand>>
    const topFrameId = 'abc'
    const autFrameId = 'def'

    // @ts-expect-error
    const topExecutionContext: Protocol.Runtime.ExecutionContextDescription = {
      id: 123,
      auxData: {
        frameId: topFrameId,
      },
    }
    // @ts-expect-error
    const autExecutionContext: Protocol.Runtime.ExecutionContextDescription = {
      id: 456,
      auxData: {
        frameId: autFrameId,
      },
    }

    let executionContexts: Map<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription> = new Map()

    const autFrame = {
      frame: {
        id: autFrameId,
        name: 'Your project:',
      },
    }

    const frameTree: Protocol.Page.FrameTree = {
      // @ts-expect-error - partial mock of the frame tree
      frame: {
        id: topFrameId,
      },
      childFrames: [
        // @ts-expect-error - partial mock of the frame tree
        autFrame,
      ],
    }

    beforeEach(() => {
      sendFn = sinon.stub()
      executionContexts.set(topExecutionContext.id, topExecutionContext)
      executionContexts.set(autExecutionContext.id, autExecutionContext)
    })

    describe('when the aut frame does not have focus', () => {
      const topActiveElement: Protocol.Runtime.EvaluateResponse = {
        result: {
          type: 'object',
          description: 'a.some-link',
        },
      }

      beforeEach(() => {
        sendFn.withArgs('Runtime.evaluate', {
          expression: 'document.activeElement',
          contextId: topExecutionContext.id,
        }).resolves(topActiveElement)
      })

      it('focuses the frame and sends keydown and keyup', async () => {
        await cdpKeyPress(tab, sendFn, executionContexts, frameTree)
        expect(sendFn).to.have.been.calledWith('Runtime.evaluate', {
          expression: 'window.focus()',
          contextId: autExecutionContext.id,
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          code: 'Tab',
          key: 'Tab',
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          code: 'Tab',
          key: 'Tab',
        })
      })

      describe('when there are invalid execution contexts associated with the top frame', () => {
        // @ts-expect-error - this is a "fake" partial
        const invalidExecutionContext: Protocol.Runtime.ExecutionContextDescription = {
          id: 9,
          auxData: {
            frameId: topFrameId,
          },
        }

        beforeEach(() => {
          executionContexts = new Map()
          executionContexts.set(invalidExecutionContext.id, invalidExecutionContext)
          executionContexts.set(topExecutionContext.id, topExecutionContext)
          executionContexts.set(autExecutionContext.id, autExecutionContext)
          sendFn.withArgs('Runtime.evaluate', {
            expression: 'document.activeElement',
            contextId: invalidExecutionContext.id,
          }).rejects(new Error('Cannot find context with specified id'))
        })

        it('does not throw', async () => {
          let thrown: any = undefined

          try {
            await cdpKeyPress(tab, sendFn, executionContexts, frameTree)
          } catch (e) {
            thrown = e
          }

          expect(thrown).to.be.undefined
        })
      })
    })

    describe('when the aut frame has focus', () => {
      const topActiveElement: Protocol.Runtime.EvaluateResponse = {
        result: {
          type: 'object',
          description: autFrame.frame.name,
        },
      }

      beforeEach(() => {
        sendFn.withArgs('Runtime.evaluate', {
          expression: 'document.activeElement',
          contextId: topExecutionContext.id,
        }).resolves(topActiveElement)
      })

      it('dispatches a keydown followed by a keyup event to the provided send fn with the tab keycode', async () => {
        await cdpKeyPress(tab, sendFn, executionContexts, frameTree)

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key: 'Tab',
          code: 'Tab',
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          key: 'Tab',
          code: 'Tab',
        })
      })

      describe('when supplied a valid named key', () => {
        for (const key of NamedKeys.filter((k) => k !== SpaceKey)) {
          it(`dispatches a keydown followed by a keyup event to the provided send fn with the ${key} keycode`, async () => {
            await cdpKeyPress(key as SupportedKey, sendFn, executionContexts, frameTree)

            expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
              type: 'keyDown',
              key,
              code: key,
            })

            expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
              type: 'keyUp',
              key,
              code: key,
            })
          })
        }

        it(`dispatches ' ' as text and key, with no code, when the named Space key is pressed`, async () => {
          await cdpKeyPress(toSupportedKey(SpaceKey), sendFn, executionContexts, frameTree)

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: ' ',
            text: ' ',
          })

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: ' ',
            text: ' ',
          })
        })
      })

      describe('when supplied a valid character key', () => {
        const key: SupportedKey = 'a' as SupportedKey

        it('adds text to the keydown event data', async () => {
          await cdpKeyPress(key, sendFn, executionContexts, frameTree)

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key,
            text: key,
          })
        })
      })

      describe('when supplied a utf8 key', () => {
        const codeOne = 'e'
        const codeTwo = '́'
        const value = 'é'
        let key: SupportedKey

        beforeEach(() => {
          key = toSupportedKey(value)
        })

        it('dispatches a keydown followed by a keyup event to the provided send fn with the a keycode', async () => {
          await cdpKeyPress(key, sendFn, executionContexts, frameTree)

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: codeOne,
            text: codeOne,
          })

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: codeOne,
            text: codeOne,
          })

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: codeTwo,
            text: codeTwo,
          })

          expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: codeTwo,
            text: codeTwo,
          })
        })
      })
    })
  })

  describe('bidi', () => {
    let client: Sinon.SinonStubbedInstance<WebdriverClient>
    let autContext: string
    let key: SupportedKey
    const iframeElement = {
      'element-6066-11e4-a52e-4f735466cecf': 'uuid-1',
    }
    const otherElement = {
      'element-6066-11e4-a52e-4f735466cecf': 'uuid-2',
    }
    const topLevelContext = 'b7173d71-c76c-41ec-beff-25a72f7cae13'

    beforeEach(() => {
      const stubbedClientMethods: (keyof WebdriverClient)[] = ['inputPerformActions', 'inputReleaseActions', 'getActiveElement', 'findElement', 'scriptEvaluate', 'getWindowHandle', 'switchToWindow', 'browsingContextGetTree']

      // @ts-expect-error - webdriver doesn't export the constructor
      client = {
        ...stubbedClientMethods.reduce((acc, method) => {
          acc[method] = stubClientMethod(method)

          return acc
        }, {} as Record<keyof WebdriverClient, Sinon.SinonStub<ClientParams<keyof WebdriverClient>, ClientReturn<keyof WebdriverClient>>>),
      }

      autContext = 'someContextId'

      key = toSupportedKey('Tab')

      client.switchToWindow.resolves()
      client.inputPerformActions.resolves()
      client.browsingContextGetTree.resolves({
        contexts: [
          {
            context: topLevelContext,
            children: [],
            url: 'someUrl',
            userContext: 'userContext',
            clientWindow: 'clientWindow',
            originalOpener: 'originalOpener',
          },
        ],
      })
    })

    describe('when the aut iframe is not in focus', () => {
      beforeEach(() => {
        client.getWindowHandle.resolves(topLevelContext)
        client.findElement.withArgs('css selector', 'iframe.aut-iframe').resolves(iframeElement)
        // @ts-expect-error - webdriver types show this returning a string, but it actually returns an ElementReference, same as findElement
        client.getActiveElement.resolves(otherElement)
      })

      it('focuses the frame before dispatching keydown and keyup, and then releases the input actions', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.scriptEvaluate).to.have.been.calledWith({
          expression: 'window.focus()',
          target: { context: autContext },
          awaitPromise: false,
        })

        const expectedValue = BidiOverrideCodepoints[key] ?? key

        expect(client.inputPerformActions.firstCall.args[0]).to.deep.equal({
          context: autContext,
          actions: [{
            type: 'key',
            id: 'someContextId-Tab-idSuffix',
            actions: [
              { type: 'keyDown', value: expectedValue },
              { type: 'keyUp', value: expectedValue },
            ],
          }],
        })

        expect(client.inputReleaseActions).to.have.been.calledWith({
          context: autContext,
        })
      })
    })

    describe('when webdriver classic has no active window', () => {
      beforeEach(() => {
        client.getWindowHandle.rejects(new Error())
      })

      it('activates the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).to.have.been.calledWith(topLevelContext)
      })
    })

    describe('when webdriver classic has the top level context as the active window', () => {
      beforeEach(() => {
        client.getWindowHandle.resolves(topLevelContext)
      })

      it('does not activate the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).not.to.have.been.called
      })
    })

    describe('when webdriver classic has a different window than the top level context as the active window', () => {
      beforeEach(() => {
        client.getWindowHandle.resolves('fa54442b-bc42-45fa-9996-88b7fd066211')
      })

      it('activates the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).to.have.been.calledWith(topLevelContext)
      })
    })

    describe('when supplied an overridden codepoint', () => {
      beforeEach(() => {
        client.findElement.withArgs('css selector', 'iframe.aut-iframe').resolves(iframeElement)
        // @ts-expect-error - webdriver types show this returning a string, but it actually returns an ElementReference, same as findElement
        client.getActiveElement.resolves(iframeElement)
      })

      for (const [key, value] of Object.entries(BidiOverrideCodepoints) as [SupportedKey, string][]) {
        // special handling to render the source unicode instead of the rendered unicode
        it(`dispatches a keydown and keyup action with the value '\\u${value.charCodeAt(0).toString(16).toUpperCase()}' for key '${key}'`, async () => {
          await bidiKeyPress(key, client, autContext, 'idSuffix')

          expect(client.inputPerformActions.firstCall.args[0]).to.deep.equal({
            context: autContext,
            actions: [{
              type: 'key',
              id: `someContextId-${key}-idSuffix`,
              actions: [
                { type: 'keyDown', value },
                { type: 'keyUp', value }, // in some browsers, F6 will cause the frame to lose focus, so the keyup will not be triggered
              ],
            }],
          })

          expect(client.inputReleaseActions).to.have.been.calledWith({
            context: autContext,
          })
        })
      }
    })

    describe('when supplied a multi-codepointutf8 key', () => {
      const codeOne = 'e'
      const codeTwo = '́'
      const value = 'é'
      let key: SupportedKey

      beforeEach(() => {
        key = toSupportedKey(value)
      })

      it('dispatches one keydown followed by a keyup event for each codepoint', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')

        expect(client.inputPerformActions.firstCall.args[0]).to.deep.equal({
          context: autContext,
          actions: [{
            type: 'key',
            id: `someContextId-${key}-idSuffix`,
            actions: [
              { type: 'keyDown', value: codeOne },
              { type: 'keyUp', value: codeOne },
              { type: 'keyDown', value: codeTwo },
              { type: 'keyUp', value: codeTwo },
            ],
          }],
        })
      })
    })
  })
})
