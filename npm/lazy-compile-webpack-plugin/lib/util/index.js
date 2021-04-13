const toString = Object.prototype.toString

function isRegExp (target) {
  return toString.call(target) === `[object RegExp]`
}

function isFunction (target) {
  return toString.call(target) === `[object Function]`
}

module.exports = {
  isRegExp,
  isFunction,
}
