import findProcess from 'find-process'

type ProcessInfo = {
  pid: number
  ppid?: number
  name: string
  cmd: string
  bin?: string
  uid?: number
  gid?: number
}

const byPid = (pid: number): Promise<ProcessInfo[]> => {
  return findProcess('pid', pid)
}

export { byPid }

export type { ProcessInfo }

module.exports = {
  byPid,
}
