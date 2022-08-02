import type { NotInstalledError, NotDetectedAtPathError } from './types'

export const notInstalledErr = (name: string, message?: string) => {
  const err = new Error(
    message || `Browser not installed: ${name}`,
  ) as NotInstalledError

  err.notInstalled = true

  return err
}

export const notDetectedAtPathErr = (stdout: string) => {
  const err = new Error(stdout) as NotDetectedAtPathError

  err.notDetectedAtPath = true

  return err
}
