module.exports = (on) => {
  on('task', {
    'return:arg' (arg) {
      return arg
    },
    'wait' () {
      return new Promise((resolve) => {
        setTimeout(resolve, 2000)
      })
    },
  })
}
