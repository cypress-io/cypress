if (process.env.CYPRESS_ENV !== 'production') {
  require("coffee-script/register")

  // using hack found here to prevent problems with
  // cypress coffee script being replaced by modules which
  // use coffee-script/register
  // https://github.com/abresas/register-coffee-coverage/blob/master/index.js
  const loader = require.extensions[".coffee"]

  Object.defineProperty(require.extensions, ".coffee", {
    get () {
      return loader
    },

    set () {
      return loader
    },
  })
}
