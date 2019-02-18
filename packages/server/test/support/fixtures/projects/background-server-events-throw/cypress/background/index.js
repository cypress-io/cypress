module.exports = (on) => {
  on('spec:start', () => {
    throw new Error('spec:start throws error')
  })
}
