// @ts-check
'use strict'
const getErrname = require('./commit-info/node_modules/execa/index')

module.exports = function getErrnameJSON(n) {
  return JSON.stringify({ errname: getErrname(n) })
}
