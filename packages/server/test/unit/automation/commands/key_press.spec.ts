import type Sinon from 'sinon'
import type { KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp_automation'
import { cdpKeyPress, bidiKeyPress, BIDI_VALUE, CDP_KEYCODE } from '../../../../lib/automation/commands/key_press'
import { Client as WebdriverClient } from 'webdriver'
import type { Protocol } from 'devtools-protocol'

const { expect, sinon } = require('../../../spec_helper')

describe('key:press automation command', () => {
  describe('cdp()', () => {
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

    const executionContexts: Record<Protocol.Runtime.ExecutionContextId, Protocol.Runtime.ExecutionContextDescription> = {
      [topExecutionContext.id]: topExecutionContext,
      [autExecutionContext.id]: autExecutionContext,
    }

    const autFrame = {
      frame: {
        id: autFrameId,
        name: 'Your project',
      },
    },

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
        await cdpKeyPress({ key: 'Tab' }, sendFn, executionContexts, frameTree)
        expect(sendFn).to.have.been.calledWith('Runtime.evaluate', {
          expression: 'window.focus()',
          contextId: autExecutionContext.id,
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          keyIdentifier: CDP_KEYCODE.Tab,
          key: 'Tab',
          code: 'Tab',
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          keyIdentifier: CDP_KEYCODE.Tab,
          key: 'Tab',
          code: 'Tab',
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

      it('dispaches a keydown followed by a keyup event to the provided send fn with the tab keycode', async () => {
        await cdpKeyPress({ key: 'Tab' }, sendFn, executionContexts, frameTree)

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyDown',
          keyIdentifier: CDP_KEYCODE.Tab,
          key: 'Tab',
          code: 'Tab',
        })

        expect(sendFn).to.have.been.calledWith('Input.dispatchKeyEvent', {
          type: 'keyUp',
          keyIdentifier: CDP_KEYCODE.Tab,
          key: 'Tab',
          code: 'Tab',
        })
      })
    })

    describe('when supplied an invalid key', () => {
      it('errors', async () => {
        // typescript would keep this from happening, but it hasn't yet
        // been checked for correctness since being received by automation
        // @ts-expect-error
        await expect(cdpKeyPress({ key: 'foo' }, sendFn, executionContexts, frameTree)).to.be.rejectedWith('foo is not supported by \'cy.press()\'.')
      })
    })
  })

  describe('bidi', () => {
    let client: Sinon.SinonStubbedInstance<WebdriverClient>
    let context: string
    let key: KeyPressSupportedKeys

    beforeEach(() => {
      // can't create a sinon stubbed instance because webdriver doesn't export the constructor. Because it's known that
      // bidiKeypress only invokes inputPerformActions, and inputPerformActions is properly typed, this is okay.
      // @ts-expect-error
      client = {
        inputPerformActions: (sinon as Sinon.SinonSandbox).stub<Parameters<WebdriverClient['inputPerformActions']>, ReturnType<WebdriverClient['inputPerformActions']>>(),
      }

      context = 'someContextId'

      key = 'Tab'
    })

    it('calls client.inputPerformActions with a keydown, pause, and keyup action', () => {
      bidiKeyPress({ key }, client as WebdriverClient, context, 'idSuffix')

      expect(client.inputPerformActions.firstCall.args[0]).to.deep.equal({
        context,
        actions: [{
          type: 'key',
          id: 'someContextId-Tab-idSuffix',
          actions: [
            { type: 'keyDown', value: BIDI_VALUE[key] },
            { type: 'keyUp', value: BIDI_VALUE[key] },
          ],
        }],
      })
    })
  })
})
