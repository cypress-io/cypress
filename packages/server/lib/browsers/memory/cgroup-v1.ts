import fs from 'fs-extra'
import { parseMemoryStat, availableFromWorkingSet } from './cgroup-util'
import type { MemoryLog } from './cgroup-util'

// Returns the total memory limit in bytes from the memory cgroup.
const getTotalMemoryLimit = async () => {
  return Number(await fs.readFile('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8'))
}

// Returns the available memory in bytes from the memory cgroup.
const getAvailableMemory = async (totalMemoryLimit: number, log?: MemoryLog) => {
  // retrieve the memory usage and memory stats from the memory cgroup
  const [usage, rawStats] = await Promise.all([
    fs.readFile('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8'),
    fs.readFile('/sys/fs/cgroup/memory/memory.stat', 'utf8'),
  ])

  return availableFromWorkingSet(totalMemoryLimit, Number(usage), parseMemoryStat(rawStats).total_inactive_file, log)
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
