import fs from 'fs-extra'
import { afterEach, describe, expect, it, vi } from 'vitest'
import memory from '../../../../lib/browsers/memory/cgroup-v1'

const readFileResolving = (contents: Record<string, string>) => {
  return vi.spyOn(fs, 'readFile').mockImplementation((async (path: string, encoding: string) => {
    return encoding === 'utf8' ? contents[path] : undefined
  }) as any)
}

describe('lib/browsers/memory/cgroup-v1', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#getTotalMemoryLimit', () => {
    it('returns total memory limit from limit_in_bytes', async () => {
      readFileResolving({ '/sys/fs/cgroup/memory/memory.limit_in_bytes': '100' })

      expect(await memory.getTotalMemoryLimit()).toBe(100)
    })
  })

  describe('#getAvailableMemory', () => {
    it('returns available memory from cgroup', async () => {
      readFileResolving({
        '/sys/fs/cgroup/memory/memory.usage_in_bytes': '100',
        '/sys/fs/cgroup/memory/memory.stat': 'total_inactive_file 50',
      })

      expect(await memory.getAvailableMemory(200)).toBe(150)
    })
  })
})
