import debugModule from 'debug'
import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

const debugVerbose = debugModule('cypress-verbose:server:browsers:memory:cgroupV1')

const getTotalMemoryLimit = async () => {
  const limit = Number((await execAsync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout)

  debugVerbose('total memory limit', limit)

  return limit
}

const processRawStats = (rawStats: string): { total_inactive_file: string } => {
  const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr): { total_inactive_file: string} => {
    const stat = arr.split(' ')

    acc[stat[0]] = stat[1]

    return acc
  }, {} as { total_inactive_file: string })

  return stats
}

const getAvailableMemory = async (totalMemoryLimit: number, log) => {
  let available

  const [usageExec, rawStats] = await Promise.all([
    execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
    execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
  ])

  const stats = processRawStats(rawStats.stdout)
  const usage = Number(usageExec.stdout)

  available = totalMemoryLimit - usage + Number(stats.total_inactive_file)

  if (log) {
    log.totalMemoryWorkingSetUsed = (usage - Number(stats.total_inactive_file))
  }

  debugVerbose('memory available', available)

  return available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
