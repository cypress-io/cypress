import crypto from 'crypto'

// return a random id
export const id = (length = 5): string => {
  return Array.from({ length }, () => crypto.randomInt(36).toString(36)).join('')
}
