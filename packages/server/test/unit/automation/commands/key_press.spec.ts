import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { SupportedKey, SupportedNamedKey } from '@packages/types'
import { NamedKeys, toSupportedKey } from '@packages/types'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp-protocol/cdp_automation'
import { cdpKeyPress, bidiKeyPress, BidiOverrideCodepoints } from '../../../../lib/automation/commands/key_press'
import type { Client as WebdriverClient } from 'webdriver'
import type { Protocol } from 'devtools-protocol'

const stubbedClientMethods = ['inputPerformActions', 'inputReleaseActions', 'getActiveElement', 'findElement', 'scriptEvaluate', 'getWindowHandle', 'switchToWindow', 'browsingContextGetTree'] as const

type StubbedClient = WebdriverClient & Record<typeof stubbedClientMethods[number], Mock>

type MockedSendDebuggerCommand = SendDebuggerCommand & Mock

describe('key:press automation command', () => {
  const tab: SupportedKey = toSupportedKey('Tab')
  const tabParams = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, location: 0 }

  describe('cdp', () => {
    const activeElementExpression = `document.activeElement instanceof HTMLIFrameElement ? document.activeElement.name || document.activeElement.id : ''`
    let sendFn: MockedSendDebuggerCommand
    const topFrameId = 'abc'
    const autFrameId = 'def'

    // @ts-expect-error - partial mock of the execution context
    const topExecutionContext: Protocol.Runtime.ExecutionContextDescription = {
      id: 123,
      auxData: {
        frameId: topFrameId,
      },
    }
    // @ts-expect-error - partial mock of the execution context
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

    // per-context answers to the active element evaluation; any other command,
    // or a context with no entry here, resolves undefined
    let activeElementResponses: Map<Protocol.Runtime.ExecutionContextId, () => Protocol.Runtime.EvaluateResponse>

    beforeEach(() => {
      activeElementResponses = new Map()
      sendFn = vi.fn(async (command: string, data: any) => {
        if (command === 'Runtime.evaluate' && data?.expression === activeElementExpression) {
          return activeElementResponses.get(data.contextId)?.()
        }

        return undefined
      }) as unknown as MockedSendDebuggerCommand

      executionContexts.set(topExecutionContext.id, topExecutionContext)
      executionContexts.set(autExecutionContext.id, autExecutionContext)
    })

    describe('when the aut frame does not have focus', () => {
      const topActiveElement: Protocol.Runtime.EvaluateResponse = {
        result: {
          type: 'string',
          value: '',
        },
      }

      beforeEach(() => {
        activeElementResponses.set(topExecutionContext.id, () => topActiveElement)
      })

      it('focuses the frame and sends keydown and keyup', async () => {
        await cdpKeyPress(tab, sendFn, executionContexts, frameTree)
        expect(sendFn).toHaveBeenCalledWith('Runtime.evaluate', {
          expression: 'window.focus()',
          contextId: autExecutionContext.id,
        })

        expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          ...tabParams,
        })

        expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          ...tabParams,
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
          activeElementResponses.set(invalidExecutionContext.id, () => {
            throw new Error('Cannot find context with specified id')
          })
        })

        it('does not throw', async () => {
          let thrown: any = undefined

          try {
            await cdpKeyPress(tab, sendFn, executionContexts, frameTree)
          } catch (e) {
            thrown = e
          }

          expect(thrown).toBeUndefined()
        })
      })
    })

    describe('when the aut frame has focus', () => {
      const topActiveElement: Protocol.Runtime.EvaluateResponse = {
        result: {
          type: 'string',
          value: autFrame.frame.name,
        },
      }

      beforeEach(() => {
        activeElementResponses.set(topExecutionContext.id, () => topActiveElement)
      })

      it('dispatches a keydown followed by a keyup event to the provided send fn with the tab keycode', async () => {
        await cdpKeyPress(tab, sendFn, executionContexts, frameTree)

        expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          ...tabParams,
        })

        expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          ...tabParams,
        })
      })

      describe('when supplied a valid named key', () => {
        const expectedNamedKeyParams: Record<SupportedNamedKey, Record<string, unknown>> = {
          ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, location: 0 },
          ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, location: 0 },
          ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, location: 0 },
          ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38, location: 0 },
          End: { key: 'End', code: 'End', windowsVirtualKeyCode: 35, location: 0 },
          Home: { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, location: 0 },
          PageDown: { key: 'PageDown', code: 'PageDown', windowsVirtualKeyCode: 34, location: 0 },
          PageUp: { key: 'PageUp', code: 'PageUp', windowsVirtualKeyCode: 33, location: 0 },
          Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, location: 0, text: '\r' },
          Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, location: 0 },
          Backspace: { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, location: 0 },
          Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, location: 0, text: ' ' },
          Delete: { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46, location: 0 },
          Insert: { key: 'Insert', code: 'Insert', windowsVirtualKeyCode: 45, location: 0 },
          Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, location: 0 },
        }

        it('covers every named key', () => {
          expect(Object.keys(expectedNamedKeyParams).sort()).toEqual([...NamedKeys].sort())
        })

        for (const [key, params] of Object.entries(expectedNamedKeyParams)) {
          it(`dispatches exactly one keydown and one keyup with the US layout params for ${key}`, async () => {
            await cdpKeyPress(toSupportedKey(key), sendFn, executionContexts, frameTree)

            const keyEvents = sendFn.mock.calls.filter(([command]) => command === 'Input.dispatchKeyEvent')

            expect(keyEvents).toEqual([
              ['Input.dispatchKeyEvent', { type: 'keyDown', ...params }],
              ['Input.dispatchKeyEvent', { type: 'keyUp', ...params }],
            ])
          })
        }
      })

      describe('when supplied a character key on the US layout', () => {
        const expectedCharacterParams: Record<string, Record<string, unknown>> = {
          a: { key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, location: 0, text: 'a' },
          Z: { key: 'Z', code: 'KeyZ', windowsVirtualKeyCode: 90, location: 0, text: 'Z' },
          1: { key: '1', code: 'Digit1', windowsVirtualKeyCode: 49, location: 0, text: '1' },
          '!': { key: '!', code: 'Digit1', windowsVirtualKeyCode: 49, location: 0, text: '!' },
          ' ': { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, location: 0, text: ' ' },
          '\r': { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, location: 0, text: '\r' },
          '\n': { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, location: 0, text: '\r' },
        }

        for (const [key, params] of Object.entries(expectedCharacterParams)) {
          it(`dispatches key, code, text, windowsVirtualKeyCode and location for ${JSON.stringify(key)}`, async () => {
            await cdpKeyPress(toSupportedKey(key), sendFn, executionContexts, frameTree)

            expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', { type: 'keyDown', ...params })
            expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', { type: 'keyUp', ...params })
          })
        }
      })

      describe('when supplied a character that is not on the US layout', () => {
        it('dispatches only key and text', async () => {
          await cdpKeyPress(toSupportedKey('€'), sendFn, executionContexts, frameTree)

          expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', { type: 'keyDown', key: '€', text: '€' })
          expect(sendFn).toHaveBeenCalledWith('Input.dispatchKeyEvent', { type: 'keyUp', key: '€', text: '€' })
        })
      })

      describe('when supplied a utf8 key', () => {
        const codeOne = 'e'
        const codeTwo = '\u0301'
        const value = 'e\u0301'
        let key: SupportedKey

        beforeEach(() => {
          key = toSupportedKey(value)
        })

        it('dispatches a keydown followed by a keyup event for each codepoint', async () => {
          await cdpKeyPress(key, sendFn, executionContexts, frameTree)

          const keyEvents = sendFn.mock.calls.filter(([command]) => command === 'Input.dispatchKeyEvent')
          const eParams = { key: codeOne, code: 'KeyE', windowsVirtualKeyCode: 69, location: 0, text: codeOne }

          expect(keyEvents).toEqual([
            ['Input.dispatchKeyEvent', { type: 'keyDown', ...eParams }],
            ['Input.dispatchKeyEvent', { type: 'keyUp', ...eParams }],
            ['Input.dispatchKeyEvent', { type: 'keyDown', key: codeTwo, text: codeTwo }],
            ['Input.dispatchKeyEvent', { type: 'keyUp', key: codeTwo, text: codeTwo }],
          ])
        })
      })
    })
  })

  describe('bidi', () => {
    let client: StubbedClient
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
      client = stubbedClientMethods.reduce((acc, method) => {
        acc[method] = vi.fn()

        return acc
      }, {} as StubbedClient)

      autContext = 'someContextId'

      key = toSupportedKey('Tab')

      client.switchToWindow.mockResolvedValue(undefined)
      client.inputPerformActions.mockResolvedValue(undefined)
      client.browsingContextGetTree.mockResolvedValue({
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
        client.getWindowHandle.mockResolvedValue(topLevelContext)
        client.findElement.mockImplementation((using: string, value: string) => using === 'css selector' && value === 'iframe.aut-iframe' ? iframeElement : undefined)
        client.getActiveElement.mockResolvedValue(otherElement)
      })

      it('focuses the frame before dispatching keydown and keyup, and then releases the input actions', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.scriptEvaluate).toHaveBeenCalledWith({
          expression: 'window.focus()',
          target: { context: autContext },
          awaitPromise: false,
        })

        const expectedValue = BidiOverrideCodepoints[key] ?? key

        expect(client.inputPerformActions.mock.calls[0][0]).toStrictEqual({
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

        expect(client.inputReleaseActions).toHaveBeenCalledWith({
          context: autContext,
        })
      })
    })

    describe('when webdriver classic has no active window', () => {
      beforeEach(() => {
        client.getWindowHandle.mockRejectedValue(new Error())
      })

      it('activates the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).toHaveBeenCalledWith(topLevelContext)
      })
    })

    describe('when webdriver classic has the top level context as the active window', () => {
      beforeEach(() => {
        client.getWindowHandle.mockResolvedValue(topLevelContext)
      })

      it('does not activate the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).not.toHaveBeenCalled()
      })
    })

    describe('when webdriver classic has a different window than the top level context as the active window', () => {
      beforeEach(() => {
        client.getWindowHandle.mockResolvedValue('fa54442b-bc42-45fa-9996-88b7fd066211')
      })

      it('activates the top level context window', async () => {
        await bidiKeyPress(key, client, autContext, 'idSuffix')
        expect(client.switchToWindow).toHaveBeenCalledWith(topLevelContext)
      })
    })

    describe('when supplied an overridden codepoint', () => {
      beforeEach(() => {
        client.findElement.mockImplementation((using: string, value: string) => using === 'css selector' && value === 'iframe.aut-iframe' ? iframeElement : undefined)
        client.getActiveElement.mockResolvedValue(iframeElement)
      })

      for (const [key, value] of Object.entries(BidiOverrideCodepoints) as [SupportedKey, string][]) {
        // special handling to render the source unicode instead of the rendered unicode
        it(`dispatches a keydown and keyup action with the value '\\u${value.charCodeAt(0).toString(16).toUpperCase()}' for key '${key}'`, async () => {
          await bidiKeyPress(key, client, autContext, 'idSuffix')

          expect(client.inputPerformActions.mock.calls[0][0]).toStrictEqual({
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

          expect(client.inputReleaseActions).toHaveBeenCalledWith({
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

        expect(client.inputPerformActions.mock.calls[0][0]).toStrictEqual({
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
