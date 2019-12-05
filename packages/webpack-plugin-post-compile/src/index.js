const { isFunction } = require('lodash')

const PostCompile = (fn, { once }) => {
  if (!isFunction(fn)) {
    throw new Error(`First parameter must be a function; found ${JSON.stringify(fn, null, 4)}`)
  }

  let compilationCount = 1

  return {
    apply: (compiler) => {
      compiler.hooks.done.tap('webpack-plugin-post-compile', (compilation) => {
        if (once && compilationCount > 1) {
          return
        }

        fn(compilation)
        compilationCount++
      })
    },
  }
}

module.exports = PostCompile
