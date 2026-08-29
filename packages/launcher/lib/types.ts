export type NotInstalledError = Error & { notInstalled: boolean }

export type NotDetectedAtPathError = Error & { notDetectedAtPath: boolean }

export type PathData = {
  path: string
  browserKey?: string
}
