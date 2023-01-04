import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

const getTotalMemoryLimit = async () => {
  return Number((await execAsync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout)
}

const processRawStats = (rawStats: string): { total_inactive_file: string } => {
  const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr): { total_inactive_file: string} => {
    const stat = arr.split(' ')

    acc[stat[0]] = stat[1]

    return acc
  }, {} as { total_inactive_file: string })

  return stats
}

const getAvailableMemory = async (totalMemoryLimit: number, log?: { [key: string]: any }) => {
  let available

  const [usageExec, rawStats] = await Promise.all([
    execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
    execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
  ])

  const stats = processRawStats(rawStats.stdout)
  const usage = Number(usageExec.stdout)

  const totalMemoryWorkingSetUsed = (usage - Number(stats.total_inactive_file))

  available = totalMemoryLimit - totalMemoryWorkingSetUsed

  if (log) {
    log.totalMemoryWorkingSetUsed = totalMemoryWorkingSetUsed
  }

  return available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
