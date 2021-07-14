module.exports = (on) => {
  on('task', {
    'returns:arg' (arg) {
      return arg
    },
  })
}
