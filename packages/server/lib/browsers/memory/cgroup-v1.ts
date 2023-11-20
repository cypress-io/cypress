import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

/**
 * Returns the total memory limit from the memory cgroup.
 * @returns total memory limit in bytes
 */
const getTotalMemoryLimit = async () => {
  return Number((await execAsync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout)
}

/**
 * Convert the raw memory stats into an object.
 * @param rawStats raw memory stats from the memory cgroup
 * @returns object of memory stats
 */
const convertRawStats = (rawStats: string): { total_inactive_file: string } => {
  const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr): { total_inactive_file: string} => {
    const stat = arr.split(' ')

    acc[stat[0]] = stat[1]

    return acc
  }, {} as { total_inactive_file: string })

  return stats
}

/**
 * Returns the available memory from the memory cgroup.
 * @param totalMemoryLimit total memory limit in bytes
 * @param log optional object to add the total memory working set used
 * @returns available memory in bytes
 */
const getAvailableMemory = async (totalMemoryLimit: number, log?: { [key: string]: any }) => {
  // retrieve the memory usage and memory stats from the memory cgroup
  const [usageExec, rawStats] = await Promise.all([
    execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
    execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
  ])

  const stats = convertRawStats(rawStats.stdout)
  const usage = Number(usageExec.stdout)

  // calculate the actual memory used by removing the inactive file cache from the reported usage
  const totalMemoryWorkingSetUsed = (usage - Number(stats.total_inactive_file))

  if (log) {
    log.totalMemoryWorkingSetUsed = totalMemoryWorkingSetUsed
  }

  // return the available memory by subtracting the used memory from the total memory limit
  return totalMemoryLimit - totalMemoryWorkingSetUsed
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
