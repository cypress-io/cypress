module.exports = (on) => {
  on('before:spec', () => {
    throw new Error('error thrown in before:spec')
  })
}
