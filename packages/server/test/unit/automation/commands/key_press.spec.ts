import type Sinon from 'sinon'
import type { KeyPressSupportedKeys } from '@packages/types'
import type { SendDebuggerCommand } from '../../../../lib/browsers/cdp_automation'
import { cdpKeyPress, bidiKeyPress, BIDI_VALUE, CDP_KEYCODE } from '../../../../lib/automation/commands/key_press'
import { Client as WebdriverClient } from 'webdriver'

const { expect, sinon } = require('../../../spec_helper')

describe('key:press automation command', () => {
  describe('cdp()', () => {
    let sendFn: Sinon.SinonStub<Parameters<SendDebuggerCommand>, ReturnType<SendDebuggerCommand>>

    beforeEach(() => {
      sendFn = sinon.stub()
    })

    it('dispaches a keydown followed by a keyup event to the provided send fn with the tab keycode', async () => {
      await cdpKeyPress({ key: 'Tab' }, sendFn)

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

    describe('when supplied an invalid key', () => {
      it('errors', async () => {
        // typescript would keep this from happening, but it hasn't yet
        // been checked for correctness since being received by automation
        // @ts-expect-error
        await expect(cdpKeyPress({ key: 'foo' })).to.be.rejectedWith('foo is not supported by \'cy.press()\'.')
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
