module.exports = (on) => {
  on('task:requested', (event, arg) => {
    switch (event) {
      case 'return:arg':
        return arg
      case 'wait':
        return new Promise((resolve) => {
          setTimeout(resolve, 2000)
        })
      default:
        return undefined
    }
  })
}
