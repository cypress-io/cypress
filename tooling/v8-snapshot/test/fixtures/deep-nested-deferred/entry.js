// @ts-check
'use strict'
const getErrname = require('./commit-info/execa/index')

module.exports = function getErrnameJSON(n) {
  return JSON.stringify({ errname: getErrname(n) })
}
