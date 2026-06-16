import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { parseMemoryStat, availableFromWorkingSet, type MemoryLog } from './cgroup-util'

const CGROUP_MOUNT = '/sys/fs/cgroup'

// In cgroup v2 a process's controller files live under its own cgroup, reported
// by /proc/self/cgroup as a single `0::/<path>` entry. Inside a container the
// cgroup namespace maps that cgroup to the mount root, but on a bare host the
// files live under the sub-cgroup, so resolve the base from /proc/self/cgroup.
const getCgroupBase = async () => {
  try {
    const raw = await fs.readFile('/proc/self/cgroup', 'utf8')
    // cgroup v2 reports a single `0::/<path>` entry; the path is relative to the
    // cgroup mount, so strip the leading slash before joining under CGROUP_MOUNT
    const relative = raw.split('\n').find((line) => line.startsWith('0::'))?.slice(3).trim().replace(/^\/+/, '')

    if (relative) {
      return path.join(CGROUP_MOUNT, relative)
    }
  } catch {
    // fall back to the mount root below
  }

  return CGROUP_MOUNT
}

// Whether the cgroup v2 memory interface files are readable. On a
// non-containerized host the resolved cgroup may not expose them, in which case
// the caller should fall back to the default handler.
const isAvailable = async () => {
  return fs.pathExists(path.join(await getCgroupBase(), 'memory.max'))
}

// Returns the total memory limit in bytes from the cgroup v2 unified hierarchy.
// `memory.max` holds the limit in bytes, or the literal string `max` when the
// cgroup is unconstrained, in which case we fall back to the total system memory.
const getTotalMemoryLimit = async () => {
  const limit = (await fs.readFile(path.join(await getCgroupBase(), 'memory.max'), 'utf8')).trim()

  return limit === 'max' ? os.totalmem() : Number(limit)
}

// Returns the available memory in bytes from the cgroup v2 unified hierarchy.
const getAvailableMemory = async (totalMemoryLimit: number, log?: MemoryLog) => {
  const base = await getCgroupBase()

  // retrieve the current memory usage and memory stats from the cgroup
  const [current, rawStats] = await Promise.all([
    fs.readFile(path.join(base, 'memory.current'), 'utf8'),
    fs.readFile(path.join(base, 'memory.stat'), 'utf8'),
  ])

  return availableFromWorkingSet(totalMemoryLimit, Number(current), parseMemoryStat(rawStats).inactive_file, log)
}

export default {
  isAvailable,
  getTotalMemoryLimit,
  getAvailableMemory,
}
