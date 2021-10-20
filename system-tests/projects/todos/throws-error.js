// this file is used by the e2e project various_failures_spec.js
// to test an error being thrown in a file outside the user's project

module.exports = () => {
  throw new Error('An outside error')
}
