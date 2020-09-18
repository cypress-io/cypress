/* Source: https://github.com/mochajs/mocha/blob/962c81644a523b78b571db2dc4b637a323f928e0/lib/reporters/base.js
  with modifications
*/
let diff = require('diff')
let utils = require('mocha/lib/utils')

/**
 * Default color map.
 */

const colors = {
  pass: 90,
  fail: 31,
  'bright pass': 92,
  'bright fail': 91,
  'bright yellow': 93,
  pending: 36,
  suite: 0,
  'error title': 0,
  'error message': 31,
  'error stack': 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  'diff gutter': 90,
  'diff added': 32,
  'diff removed': 31,
  'diff added inline': '30;42',
  'diff removed inline': '30;41',
}

/**
 * Color `str` with the given `type`,
 * allowing colors to be disabled,
 * as well as user-defined color
 * schemes.
 *
 * @private
 * @param {string} type
 * @param {string} str
 * @return {string}
 */
let color = function (type, str) {
  // if (!exports.useColors) {
  //   return String(str)
  // }

  return `\u001b[${colors[type]}m${str}\u001b[0m`
}

let showDiff = function (err) {
  return (
    err &&
    err.showDiff !== false &&
    sameType(err.actual, err.expected) &&
    typeof err.expected !== 'boolean' &&
    typeof err.expected !== 'number' &&
    err.expected !== undefined
  )
}

function stringifyDiffObjs (err) {
  if (!utils.isString(err.actual) || !utils.isString(err.expected)) {
    err.actual = utils.stringify(err.actual)
    err.expected = utils.stringify(err.expected)
  }
}

/**
 * Returns a diff between 2 strings with coloured ANSI output.
 *
 * @description
 * The diff will be either inline or unified dependent on the value
 * of `Base.inlineDiff`.
 *
 * @param {string} actual
 * @param {string} expected
 * @return {string} Diff
 */
let generateDiff = function (actual, expected) {
  try {
    return unifiedDiff(actual, expected)
  } catch (err) {
    let msg =
      `\n      ${
        color('diff added', '+ expected')
      } ${
        color('diff removed', '- actual:  failed to generate Mocha diff')
      }\n`

    return msg
  }
}

export function getAnsiDiff (err) {
  if (showDiff(err)) {
    stringifyDiffObjs(err)

    return generateDiff(err.actual, err.expected)
  }
}

/**
 * Returns unified diff between two strings with coloured ANSI output.
 *
 * @private
 * @param {String} actual
 * @param {String} expected
 * @return {string} The diff.
 */
function unifiedDiff (actual, expected) {
  let indent = '      '

  function cleanUp (line) {
    if (line[0] === '+') {
      return indent + colorLines('diff added', line)
    }

    if (line[0] === '-') {
      return indent + colorLines('diff removed', line)
    }

    if (line.match(/@@/)) {
      return '--'
    }

    if (line.match(/\\ No newline/)) {
      return null
    }

    return indent + line
  }
  function notBlank (line) {
    return typeof line !== 'undefined' && line !== null
  }
  let msg = diff.createPatch('string', actual, expected)
  let lines = msg.split('\n').splice(5)

  return (
    `\n      ${
      colorLines('diff added', '+ expected')
    } ${
      colorLines('diff removed', '- actual')
    }\n\n${
      lines
      .map(cleanUp)
      .filter(notBlank)
      .join('\n')}`
  )
}

/**
 * Colors lines for `str`, using the color `name`.
 *
 * @private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
function colorLines (name, str) {
  return str
  .split('\n')
  .map(function (str) {
    return color(name, str)
  })
  .join('\n')
}

/**
 * Object#toString reference.
 */
let objToString = Object.prototype.toString

/**
 * Checks that a / b have the same type.
 *
 * @private
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
function sameType (a, b) {
  return objToString.call(a) === objToString.call(b)
}
