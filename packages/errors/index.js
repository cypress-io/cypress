// The errors package is always compiled in a production build, but when we're developing locally,
// there'a chance we can run into a situation where we're requriring the
// @packages/errors from the child process in a non-ts project, and we need to build this JIT.
// Otherwise the error will incorrectly be shown as "cannot find module ./src" instead of
// the actual error. Double check that we can require './src', and if not install ts-node
try {
  require.resolve('./src')
} catch (e) {
  require('@packages/ts/registerPackages')
}

module.exports = require('./src')
