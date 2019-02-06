import { NotInstalledError } from './types'

export const notInstalledErr = (name: string, message?: string) => {
  const err: NotInstalledError = new Error(
    message || `Browser not installed: ${name}`
  ) as NotInstalledError
  err.notInstalled = true
  return err
}
