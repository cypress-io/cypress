import os from 'os'
import si from 'systeminformation'
import { afterEach, describe, expect, it, vi } from 'vitest'
import memory from '../../../../lib/browsers/memory/default'

describe('lib/browsers/memory', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#getTotalMemoryLimit', () => {
    it('returns total memory limit from os', async () => {
      vi.spyOn(os, 'totalmem').mockReturnValue(100)

      expect(await memory.getTotalMemoryLimit()).toBe(100)
    })
  })

  describe('#getAvailableMemory', () => {
    it('returns available memory from os', async () => {
      vi.spyOn(si, 'mem').mockReturnValue({ available: 50 } as any)

      expect(await memory.getAvailableMemory(100)).toBe(50)
    })
  })
})
