import { NotInstalledError, NotDetectedAtPathError } from './types'

export const notInstalledErr = (name: string, message?: string) => {
  const err = new Error(
    message || `Browser not installed: ${name}`
  ) as NotInstalledError
  err.notInstalled = true
  return err
}

export const notDetectedAtPathErr = (path: string, stdout: string) => {
  const err = new Error(
    `The version string from "${path} --version" does not match any known browser. The output was:

${stdout}`) as NotDetectedAtPathError
  err.notDetectedAtPath = true
  return err
}
