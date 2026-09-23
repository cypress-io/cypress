/* eslint-disable no-console */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import * as capture from '../../lib/capture'

describe('lib/capture', () => {
  afterEach(() => {
    return capture.restore()
  })

  describe('process.stdout.write', () => {
    let write: Mock
    let captured: ReturnType<typeof capture.stdout>

    beforeEach(() => {
      write = vi.spyOn(process.stdout, 'write') as unknown as Mock
      captured = capture.stdout()
      vi.spyOn(console, 'log').mockImplementation((msg: unknown) => {
        process.stdout.write(`${String(msg)}\n`)
      })
    })

    afterEach(() => {
      write.mockRestore()
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

      expect(captured.toString()).toEqual('foo\nbar\nbaz')

      // should still call through to write
      expect(write).toHaveBeenCalledWith('foo\n')
      expect(write).toHaveBeenCalledWith('bar\n')

      expect(write).toHaveBeenCalledWith('baz')
    })
  })

  describe('process.log', () => {
    let log: typeof process.log
    let logStub: Mock
    let captured: ReturnType<typeof capture.stdout>

    beforeEach(() => {
      log = process.log
      logStub = vi.fn()
      process.log = logStub as typeof process.log

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

      expect(captured.toString()).toEqual('foo\nbar\n')

      // should still call through to write
      expect(logStub).toHaveBeenCalledWith('foo\n')

      expect(logStub).toHaveBeenCalledWith('bar\n')
    })
  })
})
