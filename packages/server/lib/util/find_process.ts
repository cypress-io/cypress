import findProcess from 'find-process'

export const byPid = (pid: number) => {
  return findProcess('pid', pid)
}
