import random from 'randomstring'

/**
 * return a random id
 */
export const randomId = () => {
  return random.generate({
    length: 5,
    capitalization: 'lowercase',
  })
}
