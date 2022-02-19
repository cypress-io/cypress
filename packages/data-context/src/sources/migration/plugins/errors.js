module.exports = {
  throw: (err) => {
    throw err
  },
  onWarning: (warning) => {
    // ignore
  },
  get: (err) => {
    new Error(err)
  },
}
