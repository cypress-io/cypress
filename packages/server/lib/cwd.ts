import path from 'path'

export const getCwd = (...args: string[]) => {
  return path.join(__dirname, '..', ...args)
}
