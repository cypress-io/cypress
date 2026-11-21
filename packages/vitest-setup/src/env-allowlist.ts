const KEPT_VARS = new Set([
  'PATH',
  'TMPDIR',
  // Windows names are case-insensitive, so they are matched uppercased
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'PATHEXT',
  'COMSPEC',
])

export const isKeptVar = (key: string): boolean => {
  return KEPT_VARS.has(key.toUpperCase())
}

export const sanitizeEnv = (env: NodeJS.ProcessEnv): void => {
  for (const key of Object.keys(env)) {
    if (!isKeptVar(key)) {
      delete env[key]
    }
  }
}
