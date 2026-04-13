import semver from 'semver'

export function start() {
  try {
    const res = semver.valid('1.2.3') !== null
    console.log(JSON.stringify({ isValid: res }))
  } catch (err) {
    console.error(err)
    debugger
  }
}
