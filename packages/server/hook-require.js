const env = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'prod' : 'dev'

const isDev = env === 'dev'

// The binary ships compiled JavaScript and no TypeScript compiler, so registering ts-node there
// only spends startup time. The source tree still needs it when run with CYPRESS_INTERNAL_ENV=production.
function canRegisterTypeScript () {
  if (isDev) {
    return true
  }

  try {
    require.resolve('typescript')

    return true
  } catch (e) {
    return false
  }
}

const hookRequire = () => {
  if (canRegisterTypeScript()) {
    require('@packages/ts/register')
  }
}

module.exports = {
  hookRequire,
}
