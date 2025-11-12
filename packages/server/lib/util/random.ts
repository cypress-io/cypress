import random from 'randomstring'

// return a random id
export const id = (length = 5): string => {
  return random.generate({
    length,
    capitalization: 'lowercase',
  })
}
