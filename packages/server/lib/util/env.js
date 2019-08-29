const set = (key, val) => {
  return process.env[key] = val
}

const get = (key) => {
  return process.env[key]
}

module.exports = {
  set,

  get,
}
