/* eslint-disable no-console */
import { Console } from 'node:console'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as capture from '../../lib/capture'

describe('lib/capture', () => {
  afterEach(() => {
    return capture.restore()
  })

  describe('process.stdout.write', () => {
    let write: ReturnType<typeof vi.spyOn>
    let captured: ReturnType<typeof capture.stdout>

    beforeEach(() => {
      write = vi.spyOn(process.stdout, 'write')
      vi.stubGlobal('console', new Console({ stdout: process.stdout, stderr: process.stderr }))
      captured = capture.stdout()
    })

    afterEach(() => {
      write.mockRestore()
      vi.unstubAllGlobals()
    })

    it('slurps up stdout', () => {
      console.log('foo')
      console.log('bar')
      process.stdout.write('baz')

      expect(captured.data).toEqual([
        'foo\n',
        'bar\n',
        'baz',
      ])

      expect(captured.toString()).toBe('foo\nbar\nbaz')

      expect(write).toHaveBeenCalledWith('foo\n', expect.any(Function))
      expect(write).toHaveBeenCalledWith('bar\n', expect.any(Function))

      expect(write).toHaveBeenCalledWith('baz')
    })
  })

  describe('process.log', () => {
    let log: typeof process.log
    let logStub: ReturnType<typeof vi.fn>
    let captured: ReturnType<typeof capture.stdout>

    beforeEach(() => {
      log = process.log
      logStub = vi.fn()
      process.log = logStub

      captured = capture.stdout()
    })

    afterEach(() => {
      process.log = log
    })

    it('slurps up logs', () => {
      process.log('foo\n')
      process.log('bar\n')

      expect(captured.data).toEqual([
        'foo\n',
        'bar\n',
      ])

      expect(captured.toString()).toBe('foo\nbar\n')

      expect(logStub).toHaveBeenCalledWith('foo\n')

      expect(logStub).toHaveBeenCalledWith('bar\n')
    })
  })
})
