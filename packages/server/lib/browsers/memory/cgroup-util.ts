// A bag of numeric memory stats that a handler may record diagnostics onto.
export type MemoryLog = Record<string, number>

// Parse a cgroup `memory.stat` file (lines of `key value`) into a numeric lookup.
export const parseMemoryStat = (rawStats: string): Record<string, number> => {
  return rawStats.split('\n').filter(Boolean).reduce((acc, line) => {
    const [key, value] = line.split(' ')

    acc[key] = Number(value)

    return acc
  }, {} as Record<string, number>)
}

// Returns the available memory in bytes: the total limit minus the working set
// (current usage minus the inactive file cache). Records the working set on
// `log` when provided.
export const availableFromWorkingSet = (totalMemoryLimit: number, usage: number, inactiveFile: number, log?: MemoryLog) => {
  const totalMemoryWorkingSetUsed = usage - inactiveFile

  if (log) {
    log.totalMemoryWorkingSetUsed = totalMemoryWorkingSetUsed
  }

  return totalMemoryLimit - totalMemoryWorkingSetUsed
}
