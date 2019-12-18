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
  return through(function (buf, enc, next) {
    const ts = opts.typescript
    const text = buf.toString()

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
  })
}
