// @ts-check

if (process.env.CYPRESS_ENV !== 'production') {
  require('@packages/ts/register')
}

module.exports = {
  agent: require('./lib/agent'),
  connect: require('./lib/connect'),
}
