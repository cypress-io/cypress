import { sinon, proxyquire } from '../../../spec_helper'
import { expect } from 'chai'

describe('StudioElectron', () => {
  class FakeBrowserWindow {
    public options: any
    private destroyed = false

    constructor (options: any) {
      this.options = options
    }

    isDestroyed () {
      return this.destroyed
    }

    destroy () {
      this.destroyed = true
    }
  }

  let StudioElectron: typeof import('../../../../lib/cloud/studio/StudioElectron').StudioElectron

  beforeEach(() => {
    const mod = proxyquire('../lib/cloud/studio/StudioElectron', {
      electron: {
        BrowserWindow: FakeBrowserWindow,
      },
    }) as typeof import('../../../../lib/cloud/studio/StudioElectron')

    StudioElectron = mod.StudioElectron
  })

  afterEach(() => {
    sinon.restore()
  })

  it('creates a hidden BrowserWindow with hidden title bar and returns it', () => {
    const studioElectron = new StudioElectron()

    const win = studioElectron.createBrowserWindow()

    expect((win as any)).to.be.instanceOf(FakeBrowserWindow)

    const options = (win as any).options

    expect(options).to.include({
      show: false,
      titleBarStyle: 'hidden',
    })

    // destroy should clean up
    studioElectron.destroy()
    expect((studioElectron as any).browserWindow).to.be.undefined
  })

  it('destroys any existing window before creating a new one', () => {
    const studioElectron = new StudioElectron()

    // Seed an existing window
    const existing = new FakeBrowserWindow({})
    const destroyStub = sinon.stub(existing, 'destroy').callThrough()

    ;(studioElectron as any).browserWindow = existing

    const win = studioElectron.createBrowserWindow()

    expect(destroyStub).to.be.calledOnce
    expect((win as any)).to.be.instanceOf(FakeBrowserWindow)
    expect(win).to.not.equal(existing)
  })

  it('destroy is a no-op when no window exists', () => {
    const studioElectron = new StudioElectron()

    // No window set
    studioElectron.destroy()

    expect((studioElectron as any).browserWindow).to.be.undefined
  })

  it('destroy calls BrowserWindow.destroy when not already destroyed and clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})
    const destroySpy = sinon.spy(existing, 'destroy')

    sinon.stub(existing, 'isDestroyed').returns(false)

    ;(studioElectron as any).browserWindow = existing

    studioElectron.destroy()

    expect(destroySpy).to.be.calledOnce
    expect((studioElectron as any).browserWindow).to.be.undefined
  })

  it('does not call destroy when BrowserWindow is already destroyed, but still clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})
    const destroySpy = sinon.spy(existing, 'destroy')

    sinon.stub(existing, 'isDestroyed').returns(true)

    ;(studioElectron as any).browserWindow = existing

    studioElectron.destroy()

    expect(destroySpy).to.not.be.called
    expect((studioElectron as any).browserWindow).to.be.undefined
  })

  it('catches errors thrown during BrowserWindow.destroy and still clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})

    sinon.stub(existing, 'isDestroyed').returns(false)
    sinon.stub(existing, 'destroy').throws(new Error('fail to destroy'))

    ;(studioElectron as any).browserWindow = existing

    expect(() => studioElectron.destroy()).to.not.throw()
    expect((studioElectron as any).browserWindow).to.be.undefined
  })
})
