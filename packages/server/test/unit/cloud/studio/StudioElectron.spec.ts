import { afterEach, describe, expect, it, vi } from 'vitest'
import { StudioElectron } from '../../../../lib/cloud/studio/StudioElectron'

const { FakeBrowserWindow } = vi.hoisted(() => {
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

  return { FakeBrowserWindow }
})

vi.mock('electron', () => {
  return {
    BrowserWindow: FakeBrowserWindow,
    default: { BrowserWindow: FakeBrowserWindow },
  }
})

describe('StudioElectron', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a hidden BrowserWindow with hidden title bar and returns it', () => {
    const studioElectron = new StudioElectron()

    const win = studioElectron.createBrowserWindow()

    expect((win as any)).toBeInstanceOf(FakeBrowserWindow)

    const options = (win as any).options

    expect(options).toMatchObject({
      show: false,
      titleBarStyle: 'hidden',
    })

    // destroy should clean up
    studioElectron.destroy()
    expect((studioElectron as any).browserWindow).toBeUndefined()
  })

  it('destroys any existing window before creating a new one', () => {
    const studioElectron = new StudioElectron()

    // Seed an existing window
    const existing = new FakeBrowserWindow({})
    const destroyStub = vi.spyOn(existing, 'destroy')

    ;(studioElectron as any).browserWindow = existing

    const win = studioElectron.createBrowserWindow()

    expect(destroyStub).toHaveBeenCalledOnce()
    expect((win as any)).toBeInstanceOf(FakeBrowserWindow)
    expect(win).not.toBe(existing)
  })

  it('destroy is a no-op when no window exists', () => {
    const studioElectron = new StudioElectron()

    // No window set
    studioElectron.destroy()

    expect((studioElectron as any).browserWindow).toBeUndefined()
  })

  it('destroy calls BrowserWindow.destroy when not already destroyed and clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})
    const destroySpy = vi.spyOn(existing, 'destroy')

    vi.spyOn(existing, 'isDestroyed').mockReturnValue(false)

    ;(studioElectron as any).browserWindow = existing

    studioElectron.destroy()

    expect(destroySpy).toHaveBeenCalledOnce()
    expect((studioElectron as any).browserWindow).toBeUndefined()
  })

  it('does not call destroy when BrowserWindow is already destroyed, but still clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})
    const destroySpy = vi.spyOn(existing, 'destroy')

    vi.spyOn(existing, 'isDestroyed').mockReturnValue(true)

    ;(studioElectron as any).browserWindow = existing

    studioElectron.destroy()

    expect(destroySpy).not.toHaveBeenCalled()
    expect((studioElectron as any).browserWindow).toBeUndefined()
  })

  it('catches errors thrown during BrowserWindow.destroy and still clears reference', () => {
    const studioElectron = new StudioElectron()
    const existing = new FakeBrowserWindow({})

    vi.spyOn(existing, 'isDestroyed').mockReturnValue(false)
    vi.spyOn(existing, 'destroy').mockImplementation(() => {
      throw new Error('fail to destroy')
    })

    ;(studioElectron as any).browserWindow = existing

    expect(() => studioElectron.destroy()).not.toThrow()
    expect((studioElectron as any).browserWindow).toBeUndefined()
  })
})
