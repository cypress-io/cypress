import isObjectLike from 'lodash/isObjectLike'

export function start() {
  try {
    const res = isObjectLike({ a: 1, b: 2 })
    console.log(JSON.stringify({ isObjectLike: res }))
  } catch (err) {
    console.error(err)
    debugger
  }
}
