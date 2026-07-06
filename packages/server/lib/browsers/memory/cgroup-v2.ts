import fs from 'fs-extra'
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

// Whether this cgroup imposes a readable memory limit. An unconstrained cgroup
// (memory.max === 'max') has no cgroup-scoped limit to measure against, and a
// non-containerized host may not expose the file at all; in both cases the
// caller should fall back to the default handler, which reports host memory
// (os.totalmem / si.mem) accurately rather than mixing host and cgroup scales.
const isAvailable = async () => {
  try {
    const limit = (await fs.readFile(path.join(await getCgroupBase(), 'memory.max'), 'utf8')).trim()

    return limit !== 'max'
  } catch {
    return false
  }
}

// Returns the total memory limit in bytes from the cgroup v2 unified hierarchy.
// Only reached once isAvailable() has confirmed a numeric memory.max limit.
const getTotalMemoryLimit = async () => {
  return Number((await fs.readFile(path.join(await getCgroupBase(), 'memory.max'), 'utf8')).trim())
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
