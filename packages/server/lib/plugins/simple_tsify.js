let through = require('through2')

const isJson = (code) => {
  try {
    JSON.parse(code)
  } catch (e) {
    return false
  }

  return true
}

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
