import { expect } from 'chai'
import { StudioManager } from '../../lib/cloud/studio'
import { StudioLifecycleManager } from '../../lib/StudioLifecycleManager'
import { sinon } from '../spec_helper'

// Helper to wait for next tick in event loop
const nextTick = () => new Promise((resolve) => process.nextTick(resolve))

describe('StudioLifecycleManager', () => {
  let studioLifecycleManager: StudioLifecycleManager
  let mockStudioManager: StudioManager

  beforeEach(() => {
    studioLifecycleManager = new StudioLifecycleManager()
    mockStudioManager = {
      addSocketListeners: sinon.stub(),
      canAccessStudioAI: sinon.stub().resolves(true),
    } as unknown as StudioManager
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('initialize', () => {
    it('emits the initialize event', async () => {
      const emitSpy = sinon.spy(studioLifecycleManager, 'emit')

      await studioLifecycleManager.initialize()

      expect(emitSpy).to.be.calledWith('initialize')
    })
  })

  describe('isStudioReady', () => {
    it('returns false when studioManagerPromise is null', () => {
      expect(studioLifecycleManager.isStudioReady()).to.be.false
    })

    it('returns true when studioManagerPromise is set', async () => {
      await studioLifecycleManager.setStudioPromise(Promise.resolve(mockStudioManager))

      expect(studioLifecycleManager.isStudioReady()).to.be.true
    })
  })

  describe('getStudioIfReady', () => {
    it('returns null when studioManagerPromise is null', () => {
      expect(studioLifecycleManager.getStudioIfReady()).to.be.null
    })

    it('returns the promise when studioManagerPromise is set', async () => {
      const promise = Promise.resolve(mockStudioManager)

      await studioLifecycleManager.setStudioPromise(promise)

      expect(studioLifecycleManager.getStudioIfReady()).to.equal(promise)
    })
  })

  describe('getStudio', () => {
    it('throws an error when studioManagerPromise is null', async () => {
      try {
        await studioLifecycleManager.getStudio()
        expect.fail('Expected method to throw')
      } catch (error) {
        expect(error.message).to.equal('Studio manager has not been initialized')
      }
    })

    it('returns the resolved promise when studioManagerPromise is set', async () => {
      await studioLifecycleManager.setStudioPromise(Promise.resolve(mockStudioManager))

      const result = await studioLifecycleManager.getStudio()

      expect(result).to.equal(mockStudioManager)
    })
  })

  describe('setStudioPromise', () => {
    it('sets the studioManagerPromise', async () => {
      const promise = Promise.resolve(mockStudioManager)

      await studioLifecycleManager.setStudioPromise(promise)

      expect(studioLifecycleManager.studioManagerPromise).to.equal(promise)
    })

    it('emits studio:ready event when promise resolves with a studio manager', async () => {
      const emitSpy = sinon.spy(studioLifecycleManager, 'emit')
      const promise = Promise.resolve(mockStudioManager)

      await studioLifecycleManager.setStudioPromise(promise)
      // Wait for promise to resolve and event to be emitted
      await nextTick()

      expect(emitSpy).to.be.calledWith('studio:ready', mockStudioManager)
    })

    it('emits studio:ready event with null when promise resolves to null', async () => {
      const emitSpy = sinon.spy(studioLifecycleManager, 'emit')
      const promise = Promise.resolve(null)

      await studioLifecycleManager.setStudioPromise(promise)
      // Wait for promise to resolve
      await nextTick()

      expect(emitSpy).to.be.calledWith('studio:ready', null)
    })
  })

  describe('onStudioReady', () => {
    it('registers a listener with once() for studio:ready event', () => {
      const onceSpy = sinon.spy(studioLifecycleManager, 'once')
      const listener = sinon.stub()

      studioLifecycleManager.onStudioReady(listener)

      expect(onceSpy).to.be.calledWith('studio:ready', listener)
    })

    it('returns a function to remove the listener', () => {
      const offSpy = sinon.spy(studioLifecycleManager, 'off')
      const listener = sinon.stub()

      const removeListener = studioLifecycleManager.onStudioReady(listener)

      removeListener()

      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })

    it('calls listener immediately if studioManagerPromise is already resolved', async () => {
      const listener = sinon.stub()

      await studioLifecycleManager.setStudioPromise(Promise.resolve(mockStudioManager))
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(listener).to.be.calledWith(mockStudioManager)
    })

    it('does not call listener if studioManagerPromise resolves to null', async () => {
      const listener = sinon.stub()
      const offSpy = sinon.spy(studioLifecycleManager, 'off')

      await studioLifecycleManager.setStudioPromise(Promise.resolve(null))
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(listener).not.to.be.called
      // The listener should still be removed to prevent it from being called if another studioManager is set
      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })

    it('removes the listener after immediate call to prevent double execution', async () => {
      const offSpy = sinon.spy(studioLifecycleManager, 'off')
      const listener = sinon.stub()

      await studioLifecycleManager.setStudioPromise(Promise.resolve(mockStudioManager))
      // Ensure promise is resolved
      await nextTick()

      studioLifecycleManager.onStudioReady(listener)
      // Need another tick to let the promise in onStudioReady resolve
      await nextTick()

      expect(offSpy).to.be.calledWith('studio:ready', listener)
    })
  })
})
