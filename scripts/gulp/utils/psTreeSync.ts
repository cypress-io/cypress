import { execSync } from 'child_process'

function linuxOutput (pid: number): string {
  return execSync(`pgrep -P ${pid}`).toString()
}

function windowsOutput (pid: number): string {
  return execSync(`wmic process where (ParentProcessId=${pid}) get ProcessId`).toString()
}

function isValidPid (pid: unknown): pid is number {
  return typeof pid === 'number'
}

// Treated as unknown to force validation before passing to the platform
export function psTreeSync (pid: unknown): number[] {
  if (!isValidPid(pid)) {
    throw new TypeError('pid must be a number')
  }

  const output = process.platform.startsWith('win') ? windowsOutput(pid) : linuxOutput(pid)
  const childPids = output.split('\n').filter(Boolean).map(Number)

  return output === '' ? [] : childPids.flatMap(psTreeSync)
}
