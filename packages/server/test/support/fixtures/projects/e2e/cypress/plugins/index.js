module.exports = (on) => {
  on('task', {
    'returns:undefined' () {},

    'errors' (message) {
      throw new Error(message)
    },
  })
}
