import appState, { AppState } from './app-state'

describe('app state', () => {
  it('exports singleton by default', () => {
    expect(appState).to.be.instanceof(AppState)
  })

  context('#startRunning', () => {
    it('sets isRunning to true', () => {
      const instance = new AppState()
      instance.startRunning()
      expect(instance.isRunning).to.be.true
    })
  })

  context('#pause', () => {
    it('sets isPaused to true', () => {
      const instance = new AppState()
      instance.pause()
      expect(instance.isPaused).to.be.true
    })

    it('sets the next command name', () => {
      const instance = new AppState()
      instance.pause('next command')
      expect(instance.nextCommandName).to.equal('next command')
    })
  })

  context('#resume', () => {
    it('sets isPaused to false', () => {
      const instance = new AppState()
      instance.resume()
      expect(instance.isPaused).to.be.false
    })

    it('unsets the next command name', () => {
      const instance = new AppState()
      instance.resume()
      expect(instance.nextCommandName).to.be.null
    })
  })

  context('#stop', () => {
    it('sets isRunning to false', () => {
      const instance = new AppState()
      instance.stop()
      expect(instance.isRunning).to.be.false
    })

    it('resets autoScrollingEnabled', () => {
      const instance = new AppState()
      instance.setAutoScrolling(false)
      instance.stop()
      expect(instance.autoScrollingEnabled).to.be.true
    })
  })

  context('#setAutoScrolling', () => {
    it('sets autoScrollingEnabled to boolean specified', () => {
      const instance = new AppState()
      instance.setAutoScrolling(false)
      expect(instance.autoScrollingEnabled).to.be.false
    })

    it('does nothing if argument is null', () => {
      const instance = new AppState()
      instance.setAutoScrolling(null)
      expect(instance.autoScrollingEnabled).to.be.true
    })

    it('does nothing if argument is undefined', () => {
      const instance = new AppState()
      instance.setAutoScrolling()
      expect(instance.autoScrollingEnabled).to.be.true
    })
  })

  context('#toggleAutoScrolling', () => {
    it('toggles autoScrollingEnabled', () => {
      const instance = new AppState()
      instance.toggleAutoScrolling()
      expect(instance.autoScrollingEnabled).to.be.false
      instance.toggleAutoScrolling()
      expect(instance.autoScrollingEnabled).to.be.true
    })
  })

  context('#reset', () => {
    it('resets autoScrollingEnabled when it has not been toggled', () => {
      const instance = new AppState()
      instance.setAutoScrolling(false)
      instance.reset()
      expect(instance.autoScrollingEnabled).to.be.true
    })

    it('does not reset autoScrollingEnabled when it has been toggled', () => {
      const instance = new AppState()
      instance.toggleAutoScrolling()
      instance.reset()
      expect(instance.autoScrollingEnabled).to.be.false
    })

    it('sets isPaused to false', () => {
      const instance = new AppState()
      instance.isPaused = true
      instance.reset()
      expect(instance.isPaused).to.be.false
    })

    it('sets isRunning to false', () => {
      const instance = new AppState()
      instance.isRunning = true
      instance.reset()
      expect(instance.isRunning).to.be.false
    })

    it('sets nextCommandName to null', () => {
      const instance = new AppState()
      instance.nextCommandName = 'next command'
      instance.reset()
      expect(instance.nextCommandName).to.be.null
    })
  })
})
