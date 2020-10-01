module.exports = (mode, options) => {
  return require('./interactive').run(options)
  /*
  switch (mode) {
    case 'record':
      return require('./record').run(options)
    case 'run':
      return require('./run').run(options)
    case 'interactive':
    case 'smokeTest':
      return require('./smoke_test').run(options)
    default:
      break
  }
*/
}
