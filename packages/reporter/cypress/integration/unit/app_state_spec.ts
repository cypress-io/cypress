import appState, { AppState } from '../../../src/lib/app-state'

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

    it('sets isStopped to false', () => {
      const instance = new AppState()

      instance.isStopped = true
      instance.startRunning()
      expect(instance.isStopped).to.be.false
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
    it('sets isStopped to true', () => {
      const instance = new AppState()

      instance.stop()
      expect(instance.isStopped).to.be.true
    })
  })

  context('#end', () => {
    it('sets isRunning to false', () => {
      const instance = new AppState()

      instance.end()
      expect(instance.isRunning).to.be.false
    })

    it('resets autoScrollingEnabled', () => {
      const instance = new AppState()

      instance.temporarilySetAutoScrolling(false)
      instance.end()
      expect(instance.autoScrollingEnabled).to.be.true
    })
  })

  context('#temporarilySetAutoScrolling', () => {
    it('sets autoScrollingEnabled to boolean specified', () => {
      const instance = new AppState()

      instance.temporarilySetAutoScrolling(false)
      expect(instance.autoScrollingEnabled).to.be.false
    })

    it('does nothing if argument is null', () => {
      const instance = new AppState()

      instance.temporarilySetAutoScrolling(null)
      expect(instance.autoScrollingEnabled).to.be.true
    })

    it('does nothing if argument is undefined', () => {
      const instance = new AppState()

      instance.temporarilySetAutoScrolling()
      expect(instance.autoScrollingEnabled).to.be.true
    })
  })

  context('#setAutoScrolling', () => {
    it('sets autoScrollingEnabled', () => {
      const instance = new AppState()

      instance.setAutoScrolling(false)
      expect(instance.autoScrollingEnabled).to.be.false
      instance.setAutoScrolling(true)
      expect(instance.autoScrollingEnabled).to.be.true
    })

    it('sets reset value for autoScrollingEnabled', () => {
      const instance = new AppState()

      instance.setAutoScrolling(false)
      instance.reset()
      expect(instance.autoScrollingEnabled).to.be.false
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

    it('sets reset value for autoScrollingEnabled', () => {
      const instance = new AppState()

      instance.toggleAutoScrolling()
      instance.reset()
      expect(instance.autoScrollingEnabled).to.be.false
    })
  })

  context('#setForcingGc', () => {
    it('sets forcingGc', () => {
      const instance = new AppState()

      instance.setForcingGc(false)
      expect(instance.forcingGc).to.be.false
      instance.setForcingGc(true)
      expect(instance.forcingGc).to.be.true
    })
  })

  context('#setFirefoxGcInterval', () => {
    it('sets forcingGc', () => {
      const instance = new AppState()

      instance.setFirefoxGcInterval(111)
      expect(instance.firefoxGcInterval).to.eq(111)
      instance.setFirefoxGcInterval(222)
      expect(instance.firefoxGcInterval).to.eq(222)
    })
  })

  context('#reset', () => {
    it('resets autoScrollingEnabled when it has not been toggled', () => {
      const instance = new AppState()

      instance.temporarilySetAutoScrolling(false)
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

    it('sets pinnedSnapshotId to null', () => {
      const instance = new AppState()

      instance.pinnedSnapshotId = 'c4'
      instance.reset()
      expect(instance.pinnedSnapshotId).to.be.null
    })
  })
})
