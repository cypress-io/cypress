import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { activateMainTab, ACTIVATION_TIMEOUT } from '../../src/plugin/activateMainTab'

use(chaiAsPromised)
use(sinonChai)

describe('activateMainTab', () => {
  let clock: sinon.SinonFakeTimers
  let prevWin: Window
  let window: Partial<Window>

  beforeEach(() => {
    clock = sinon.useFakeTimers()

    window = {
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub(),
      // @ts-ignore
      postMessage: sinon.stub(),
    }

    // @ts-ignore
    prevWin = global.window
    //@ts-ignore
    global.window = window
  })

  afterEach(() => {
    clock.restore()
    // @ts-ignore
    global.window = prevWin
  })

  it('sends a tab activation request to the plugin, and resolves when the ack event is received', () => {
    const p = activateMainTab()

    expect(window.postMessage).to.be.calledWith({ message: 'cypress:extension:activate:main:tab' })

    // @ts-ignore
    window.addEventListener.yields({ message: 'cypress:extension:main:tab:activated' })

    expect(p).to.eventually.be.true
  })

  it('sends a tab activation request to the plugin, and rejects if it times out', () => {
    const p = activateMainTab()

    clock.tick(ACTIVATION_TIMEOUT + 1)

    expect(p).to.be.rejected
  })
})
