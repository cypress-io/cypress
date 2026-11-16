// `lib/example.ts` is an ES module, so unwrap the default here to keep
// `module.exports` the plain object every interop mode agrees on.
module.exports = require('./lib/example').default
