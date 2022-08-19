function assign() {
  if (typeof console == 'undefined') {
    // this should not be rewritten
    console = function () {}
  }
  console.log('this should also be rewritten')
  return 1
}

module.exports = assign
