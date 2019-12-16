let through = require('through2')

module.exports = function (b, opts) {
  return through(function (buf, enc, next) {
    const ts = opts.typescript

    this.push(ts.transpileModule(buf.toString(), {
      compilerOptions: {},
    }).outputText)

    next()
  })
}
