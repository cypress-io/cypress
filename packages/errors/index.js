// The errors package is always compiled in a production build, but when we're developing locally,
// there's a chance we can run into a situation where we're requiring the
// @packages/errors from the child process in a non-ts project, and we need to build this JIT.
// Otherwise the error will incorrectly be shown as "cannot find module ./src" instead of
// the actual error. Double check that we can require './src', and if not install ts-node
try {
  require.resolve('./src')
} catch (e) {
  require('@packages/ts/register')
}

module.exports = require('./src')
