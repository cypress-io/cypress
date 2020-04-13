// Copied from cypress-browserify-preprocessor for unit tests.

let through = require('through2')

const isJson = (code) => {
  try {
    JSON.parse(code)
  } catch (e) {
    return false
  }

  return true
}

// tsify doesn't have transpile-only option like ts-node or ts-loader.
// It means it should check types whenever spec file is changed
// and it slows down the test speed a lot.
// We skip this slow type-checking process by using transpileModule() api.
module.exports = function (b, opts) {
  const chunks = []

  return through(
    (buf, enc, next) => {
      chunks.push(buf.toString())
      next()
    },
    function (next) {
      const ts = opts.typescript
      const text = chunks.join('')

      if (isJson(text)) {
        this.push(text)
      } else {
        this.push(ts.transpileModule(text, {
          compilerOptions: {
            esModuleInterop: true,
            jsx: 'react',
          },
        }).outputText)
      }

      next()
    },
  )
}
