import sinon from 'sinon'

import statsStore, { StatsStore } from './stats-store'

describe('stats store', () => {
  it('exports singleton by default', () => {
    expect(statsStore).to.be.instanceof(StatsStore)
  })

  context('#startRunning', () => {
    it('sets isRunning to true', () => {
      const instance = new StatsStore()
      instance.startRunning()
      expect(instance.isRunning).to.be.true
    })
  })

  context('#start', () => {
    describe('when not running', () => {
      it('does nothing', () => {
        const instance = new StatsStore()
        instance.start({ numPassed: 1 })
        expect(instance.numPassed).to.equal(0)
      })
    })

    describe('when running', () => {
      let clock
      let instance

      beforeEach(() => {
        clock = sinon.useFakeTimers(new Date('2016-07-18').getTime())
        instance = new StatsStore()
        instance.startRunning()
        instance.start({
          startTime: '2016-07-18',
          numPassed: 1,
          numFailed: 2,
          numPending: 3,
        })
      })

      afterEach(() => {
        clock.restore()
      })

      it('sets stats', () => {
        expect(instance.numPassed).to.equal(1)
        expect(instance.numFailed).to.equal(2)
        expect(instance.numPending).to.equal(3)
      })

      it('does nothing after first call', () => {
        instance.start({ numPassed: 3 })
        expect(instance.numPassed).to.equal(1)
      })

      it('updates duration every 100 milliseconds', () => {
        clock.tick(100)
        expect(instance.duration).to.equal(100)
        clock.tick(100)
        expect(instance.duration).to.equal(200)
        clock.tick(250)
        expect(instance.duration).to.equal(400)
        clock.tick(50)
        expect(instance.duration).to.equal(500)
      })

      it('stops tracking duration when paused', () => {
        clock.tick(100)
        instance.pause()
        clock.tick(100)
        expect(instance.duration).to.equal(100)
      })

      it('stops tracking duration when stopped', () => {
        clock.tick(100)
        instance.stop()
        clock.tick(100)
        expect(instance.duration).to.equal(100)
      })
    })
  })

  context('#incrementCount', () => {
    it('increments the count for the type specified', () => {
      const instance = new StatsStore()
      instance.incrementCount('passed')
      expect(instance.numPassed).to.equal(1)
      instance.incrementCount('pending')
      instance.incrementCount('pending')
      expect(instance.numPending).to.equal(2)
      instance.incrementCount('failed')
      expect(instance.numFailed).to.equal(1)
    })
  })

  context('#pause', () => {
    let instance
    beforeEach(() => {
      instance = new StatsStore()
      instance.pause('next command')
    })

    it('sets isPaused to true', () => {
      expect(instance.isPaused).to.be.true
    })

    it('sets the nextCommandName', () => {
      expect(instance.nextCommandName).to.equal('next command')
    })
  })

  context('#resume', () => {
    let instance
    beforeEach(() => {
      instance = new StatsStore()
      instance.pause('next command')
      instance.resume()
    })

    it('sets isPaused to false', () => {
      expect(instance.isPaused).to.be.false
    })

    it('unsets the nextCommandName', () => {
      expect(instance.nextCommandName).to.be.null
    })
  })

  context('#stop', () => {
    it('sets isRunning to false', () => {
      const instance = new StatsStore()
      instance.stop()
      expect(instance.isRunning).to.be.false
    })
  })

  context('#stop', () => {
    it('sets isRunning to false', () => {
      const instance = new StatsStore()
      instance.stop()
      expect(instance.isRunning).to.be.false
    })
  })

  context('#reset', () => {
    let instance
    beforeEach(() => {
      instance = new StatsStore()
    })

    it('resets stats', () => {
      instance.startRunning()
      instance.start({
        startTime: '2016-07-18',
        numPassed: 1,
        numFailed: 2,
        numPending: 3,
      })
      instance.reset()
      expect(instance.numPassed).to.equal(0)
      expect(instance.numFailed).to.equal(0)
      expect(instance.numPending).to.equal(0)
    })

    it('resets isRunning', () => {
      instance.startRunning()
      instance.reset()
      expect(instance.isRunning).to.be.false
    })

    it('resets isPaused and nextCommandName', () => {
      instance.pause('next command')
      instance.reset()
      expect(instance.isPaused).to.be.false
      expect(instance.nextCommandName).to.be.null
    })
  })
})
