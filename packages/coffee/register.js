if (process.env.CYPRESS_ENV !== 'production') {
  require('coffeescript/register')

  // using hack found here to prevent problems with
  // cypress coffee script being replaced by modules which
  // use coffeescript/register
  // https://github.com/abresas/register-coffee-coverage/blob/master/index.js
  // remove when https://github.com/benbria/coffee-coverage/issues/69 is resolved
  const loader = require.extensions['.coffee']

  Object.defineProperty(require.extensions, '.coffee', {
    get () {
      return loader
    },

    set () {
      return loader
    },
  })
}
