import '../spec_helper'
import mockery from 'mockery'
import { enable as enableMockery, mockElectron } from '../mockery_helper'
import EventEmitter from 'events'
import { GracefulExit } from '../../lib/util/graceful-exit'

const cypress = require('../../lib/cypress')

describe('lib/cypress', () => {
  describe('.runElectron', () => {
    let child: EventEmitter

    beforeEach(() => {
      enableMockery(mockery)
      mockElectron(mockery)

      child = new EventEmitter()
      mockery.registerMock('@packages/electron', { open: () => Promise.resolve(child) })
      sinon.stub(cypress, 'isCurrentlyRunningElectron').returns(false)
    })

    afterEach(() => {
      mockery.deregisterMock('@packages/electron')
    })

    /** The spawned child is awaited before its 'close' listener is attached. */
    const closeListenerAttached = async () => {
      while (!child.listenerCount('close')) {
        await new Promise((resolve) => setImmediate(resolve))
      }
    }

    it('reports the exit code as the failure count when the app exits on its own', async () => {
      const started = cypress.runElectron('run', { testingType: 'e2e' })

      await closeListenerAttached()
      child.emit('close', 2, null)

      expect(await started).to.deep.eq({ totalFailed: 2 })
    })

    it('errors instead of reporting a failure count when the app is killed by a signal', async () => {
      const started = cypress.runElectron('run', { testingType: 'e2e' })

      await closeListenerAttached()
      child.emit('close', null, 'SIGKILL')

      let raised: any

      try {
        await started
      } catch (err) {
        raised = err
      }

      expect(raised?.type).to.eq('CYPRESS_PROCESS_CLOSED_UNEXPECTEDLY')
      expect(raised?.message).to.include('SIGKILL')
    })

    it('does not error on the signal this process is already shutting down for', async () => {
      sinon.stub(GracefulExit, 'isShuttingDown').get(() => true)

      const started = cypress.runElectron('run', { testingType: 'e2e' })

      await closeListenerAttached()
      child.emit('close', null, 'SIGINT')

      expect(await started).to.deep.eq({ totalFailed: 1 })
    })
  })
})
