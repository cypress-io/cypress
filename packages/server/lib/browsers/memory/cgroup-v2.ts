import debugModule from 'debug'
import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

const debugVerbose = debugModule('cypress-verbose:server:browsers:memory:cgroupV2')

const getTotalMemoryLimit = async () => {
  const limit = Number((await exec('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout)

  debugVerbose('total memory limit', limit)

  return limit
}

const processRawStats = (rawStats: string) => {
  const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr) => {
    const stat = arr.split(' ')

    acc[stat[0]] = stat[1]

    return acc
  }, {})

  return stats
}

const getAvailableMemory = async (totalMemoryLimit: number) => {
  let available

  const [usageExec, rawStats] = await Promise.all([
    execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
    execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
  ])

  const stats = processRawStats(rawStats.stdout)
  const usage = Number(usageExec.stdout)

  available = totalMemoryLimit - usage + stats.total_inactive_file

  debugVerbose('memory available', available)

  return available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
