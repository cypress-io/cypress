const launcher = require('@packages/launcher')
const start = () => {
  return launcher.detect()
  /* eslint-disable-next-line no-console */
  .then(console.log)
}

module.exports = {
  start,
}
