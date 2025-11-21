import { expect } from '../../spec_helper'
import sinon from 'sinon'
import type { CommandPerformanceEntry } from '@packages/types'

import { PerformanceLogger } from '../../../lib/automation/performance_logger'

describe('lib/automation/performance_logger', () => {
  let originalEnv: string | undefined
  let mockWriteStream: any
  let mkdirSyncStub: sinon.SinonStub
  let writeFileSyncStub: sinon.SinonStub
  let createWriteStreamStub: sinon.SinonStub
  let randomUUIDStub: sinon.SinonStub

  beforeEach(function () {
    // Save original env var
    originalEnv = process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING

    // Reset singleton instance
    ;(PerformanceLogger as any)._instance = undefined

    // Create mock write stream
    mockWriteStream = {
      write: sinon.stub().returns(true),
      end: sinon.stub().returns(mockWriteStream),
      once: sinon.stub().returns(mockWriteStream),
      on: sinon.stub().returns(mockWriteStream),
      emit: sinon.stub(),
      removeAllListeners: sinon.stub(),
      closed: false,
    }

    // Mock fs operations
    const fs = require('fs')

    mkdirSyncStub = sinon.stub(fs, 'mkdirSync').returns(undefined)
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync').returns(undefined)
    createWriteStreamStub = sinon.stub(fs, 'createWriteStream').returns(mockWriteStream)

    // Mock randomUUID
    const crypto = require('crypto')

    randomUUIDStub = sinon.stub(crypto, 'randomUUID').returns('test-uuid-123')
  })

  afterEach(function () {
    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = originalEnv
    } else {
      delete process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING
    }

    // Clean up singleton
    return PerformanceLogger.close().then(() => {
      ;(PerformanceLogger as any)._instance = undefined
    }).finally(() => {
      // Restore all stubs
      sinon.restore()
    })
  })

  describe('.enabled', () => {
    it('returns false when env var is not set', () => {
      delete process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING

      expect(PerformanceLogger.enabled).to.be.false
    })

    it('returns false when env var is "false"', () => {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = 'false'

      expect(PerformanceLogger.enabled).to.be.false
    })

    it('returns true when env var is "1"', () => {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = '1'

      expect(PerformanceLogger.enabled).to.be.true
    })

    it('returns true when env var is "true"', () => {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = 'true'

      expect(PerformanceLogger.enabled).to.be.true
    })
  })

  describe('.write', () => {
    context('when enabled', () => {
      beforeEach(function () {
        process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = '1'
      })

      it('creates directory and file with CSV header on first write', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mkdirSyncStub).to.be.called
        expect(writeFileSyncStub).to.be.called
        const headerCall = writeFileSyncStub.getCall(0)

        expect(headerCall.args[1]).to.equal('startTime,duration,name\n')
      })

      it('writes entry to stream', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000.5,
          duration: 50.25,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.write).to.be.called
        const writeCall = mockWriteStream.write.getCall(0)

        expect(writeCall.args[0]).to.equal('1000.5,50.25,test-command\n')
      })

      it('handles multiple writes', async function () {
        const entries: CommandPerformanceEntry[] = [
          { name: 'command1', startTime: 1000, duration: 50 },
          { name: 'command2', startTime: 1050, duration: 75 },
        ]

        for (const entry of entries) {
          await PerformanceLogger.write(entry)
        }

        expect(mockWriteStream.write).to.be.calledTwice
        expect(mockWriteStream.write.getCall(0).args[0]).to.equal('1000,50,command1\n')
        expect(mockWriteStream.write.getCall(1).args[0]).to.equal('1050,75,command2\n')
      })

      it('escapes commas in command names', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test,command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.write).to.be.called
        const writeCall = mockWriteStream.write.getCall(0)

        expect(writeCall.args[0]).to.equal('1000,50,"test,command"\n')
      })

      it('escapes quotes in command names', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test"command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.write).to.be.called
        const writeCall = mockWriteStream.write.getCall(0)

        expect(writeCall.args[0]).to.equal('1000,50,"test""command"\n')
      })

      it('escapes newlines in command names', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test\ncommand',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.write).to.be.called
        const writeCall = mockWriteStream.write.getCall(0)

        expect(writeCall.args[0]).to.equal('1000,50,"test\ncommand"\n')
      })

      it('does not quote simple values', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'simple-command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.write).to.be.called
        const writeCall = mockWriteStream.write.getCall(0)

        expect(writeCall.args[0]).to.equal('1000,50,simple-command\n')
        expect(writeCall.args[0]).to.not.include('"')
      })

      it('handles write errors gracefully', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        // Create instance first
        await PerformanceLogger.write(entry)

        // Make instance write method throw
        const instance = (PerformanceLogger as any)._instance

        sinon.stub(instance, 'write').rejects(new Error('write failed'))

        // Should not throw
        await expect(PerformanceLogger.write(entry)).to.be.fulfilled
      })

      it('skips write when logWriter is closed', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        // Write once to create instance
        await PerformanceLogger.write(entry)

        // Mark stream as closed
        mockWriteStream.closed = true

        // Reset write call count
        mockWriteStream.write.resetHistory()

        // Should not throw when writing to closed stream
        await expect(PerformanceLogger.write(entry)).to.be.fulfilled

        // Write should not be called on closed stream
        expect(mockWriteStream.write).to.not.be.called
      })

      it('waits for drain when buffer is full', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        // Write once to create instance
        await PerformanceLogger.write(entry)

        // Force write to return false (buffer full)
        mockWriteStream.write.returns(false)

        // Set up drain handler
        let drainHandler: (() => void) | undefined

        mockWriteStream.once.callsFake((event: string, handler: () => void) => {
          if (event === 'drain') {
            drainHandler = handler
          }

          return mockWriteStream
        })

        const writePromise = PerformanceLogger.write(entry)

        // Write should be pending
        await new Promise((resolve) => setTimeout(resolve, 10))
        expect(drainHandler).to.exist

        // Emit drain event
        if (drainHandler) {
          drainHandler()
        }

        await writePromise
        expect(mockWriteStream.write).to.be.calledTwice
      })
    })

    context('when disabled', () => {
      beforeEach(function () {
        process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = 'false'
      })

      it('does not create log file', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mkdirSyncStub).to.not.be.called
        expect(writeFileSyncStub).to.not.be.called
        expect(createWriteStreamStub).to.not.be.called
      })

      it('does not throw', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        await expect(PerformanceLogger.write(entry)).to.be.fulfilled
      })
    })
  })

  describe('.close', () => {
    context('when enabled', () => {
      beforeEach(function () {
        process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = '1'
      })

      it('closes the write stream', async function () {
        const entry: CommandPerformanceEntry = {
          name: 'test-command',
          startTime: 1000,
          duration: 50,
        }

        await PerformanceLogger.write(entry)

        expect(mockWriteStream.end).to.not.be.called

        // Set up close event handler
        let closeHandler: (() => void) | undefined

        mockWriteStream.once.callsFake((event: string, handler: () => void) => {
          if (event === 'close') {
            closeHandler = handler
          }

          return mockWriteStream
        })

        const closePromise = PerformanceLogger.close()

        // Simulate close event
        if (closeHandler) {
          setTimeout(() => {
            mockWriteStream.closed = true
            closeHandler!()
          }, 10)
        }

        await closePromise

        expect(mockWriteStream.end).to.be.called
        expect(mockWriteStream.removeAllListeners).to.be.called
      })

      it('handles close errors gracefully', async function () {
        await PerformanceLogger.write({
          name: 'test',
          startTime: 1000,
          duration: 50,
        })

        const instance = (PerformanceLogger as any)._instance

        sinon.stub(instance, 'close').rejects(new Error('close failed'))

        await expect(PerformanceLogger.close()).to.be.fulfilled
      })

      it('times out after 5 seconds if stream does not close', async function () {
        await PerformanceLogger.write({
          name: 'test',
          startTime: 1000,
          duration: 50,
        })

        // Prevent close event from firing
        mockWriteStream.once.callsFake(() => mockWriteStream)

        const startTime = Date.now()

        await PerformanceLogger.close()
        const duration = Date.now() - startTime

        // Should timeout around 5 seconds (with some tolerance)
        expect(duration).to.be.at.least(4900)
        expect(duration).to.be.at.most(5500)
      })

      it('returns immediately if stream is already closed', async function () {
        await PerformanceLogger.write({
          name: 'test',
          startTime: 1000,
          duration: 50,
        })

        mockWriteStream.closed = true

        const startTime = Date.now()

        await PerformanceLogger.close()
        const duration = Date.now() - startTime

        expect(duration).to.be.lessThan(100)
        expect(mockWriteStream.end).to.not.be.called
      })
    })

    context('when disabled', () => {
      beforeEach(function () {
        process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = 'false'
      })

      it('returns immediately', async function () {
        const startTime = Date.now()

        await PerformanceLogger.close()
        const duration = Date.now() - startTime

        expect(duration).to.be.lessThan(100)
      })
    })
  })

  describe('singleton behavior', () => {
    beforeEach(function () {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = '1'
    })

    it('creates single instance', async function () {
      await PerformanceLogger.write({
        name: 'test1',
        startTime: 1000,
        duration: 50,
      })

      const instance1 = (PerformanceLogger as any)._instance

      await PerformanceLogger.write({
        name: 'test2',
        startTime: 1050,
        duration: 75,
      })

      const instance2 = (PerformanceLogger as any)._instance

      expect(instance1).to.equal(instance2)
      expect(createWriteStreamStub).to.be.calledOnce
    })

    it('does not create instance when disabled', async function () {
      process.env.CYPRESS_INTERNAL_COMMAND_PERFORMANCE_LOGGING = 'false'

      await PerformanceLogger.write({
        name: 'test',
        startTime: 1000,
        duration: 50,
      })

      const instance = (PerformanceLogger as any)._instance

      expect(instance).to.be.undefined
      expect(createWriteStreamStub).to.not.be.called
    })
  })
})
