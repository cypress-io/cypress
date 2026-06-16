import { exec } from 'child_process'
import util from 'util'
import { parseMemoryStat, availableFromWorkingSet, type MemoryLog } from './cgroup-util'

const execAsync = util.promisify(exec)

// Returns the total memory limit in bytes from the memory cgroup.
const getTotalMemoryLimit = async () => {
  return Number((await execAsync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout)
}

// Returns the available memory in bytes from the memory cgroup.
const getAvailableMemory = async (totalMemoryLimit: number, log?: MemoryLog) => {
  // retrieve the memory usage and memory stats from the memory cgroup
  const [usageExec, rawStats] = await Promise.all([
    execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
    execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
  ])

  return availableFromWorkingSet(totalMemoryLimit, Number(usageExec.stdout), parseMemoryStat(rawStats.stdout).total_inactive_file, log)
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
