import sinon, { SinonFakeTimers } from 'sinon'

import statsStore, { StatsStore } from '../../../src/header/stats-store'

describe('stats store', () => {
  it('exports singleton by default', () => {
    expect(statsStore).to.be.instanceof(StatsStore)
  })

  context('#start', () => {
    describe('when running', () => {
      let clock: SinonFakeTimers
      let instance: StatsStore

      beforeEach(() => {
        clock = sinon.useFakeTimers(new Date('2016-07-18').getTime())
        instance = new StatsStore()
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
        instance.start({
          startTime: '2016-07-18',
          numPassed: 3,
        })

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

      it('picks up where it left off when paused then resumed', () => {
        clock.tick(100)
        instance.pause()
        clock.tick(100)
        expect(instance.duration).to.equal(100)
        instance.resume()
        clock.tick(100)
        expect(instance.duration).to.equal(300)
      })

      it('stops tracking duration when ended', () => {
        clock.tick(100)
        instance.end()
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

  context('#reset', () => {
    let instance: StatsStore

    beforeEach(() => {
      instance = new StatsStore()
    })

    it('resets stats', () => {
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

    it('resets ', () => {
      instance.reset()
    })
  })
})
