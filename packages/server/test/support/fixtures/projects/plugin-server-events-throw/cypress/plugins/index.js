module.exports = (on) => {
  on('before:spec', () => {
    throw new Error('before:spec throws error')
  })
}
