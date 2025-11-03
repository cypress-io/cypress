export const set = (key: string, val: string): string | undefined => {
  return process.env[key] = val
}

export const get = (key: string): string | undefined => {
  return process.env[key]
}
