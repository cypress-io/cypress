import { execSync } from 'child_process'

function linuxOutput (pid: number): string {
  try {
    return execSync(`pgrep -P ${pid}`).toString().trim()
  } catch (error) {
    return ''
  }
}

function windowsOutput (pid: number): string {
  try {
    return execSync(`wmic process where (ParentProcessId=${pid}) get ProcessId`, { stdio: 'ignore' })
    .toString()
    .replace('ProcessId', '') // Remove the header row
    .trim()
  } catch (error) {
    return ''
  }
}

function isValidPid (pid: unknown): pid is number {
  return !Number.isNaN(pid)
}

// Treated as unknown to force validation before passing to the platform
export function psTreeSync (pid: unknown): number[] {
  const root = pid ? Number(pid) : process.pid

  if (!pid) {
    // check if pgrep is installed on linux/osx, and wmic is installed on windows
    if (process.platform.startsWith('win')) {
      try {
        execSync('which wmic')
      } catch (error) {
        console.warn('wmic is not available, unable to determine process tree')

        return []
      }
    } else {
      try {
        execSync('which pgrep')
      } catch (error) {
        console.warn('pgrep is not available, unable to determine process tree')

        return []
      }
    }
  }

  if (!isValidPid(root)) {
    throw new TypeError('pid must be a number')
  }

  const output = process.platform.startsWith('win') ? windowsOutput(root) : linuxOutput(root)
  const childPids = output.split('\n').filter(Boolean).map(Number)

  if (root === process.pid) {
    return childPids.flatMap(psTreeSync)
  }

  return [root, ...childPids.flatMap(psTreeSync)]
}
