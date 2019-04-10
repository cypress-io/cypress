'use strict'
var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i]
      for (let p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) {
          t[p] = s[p]
        }
      }
    }

    return t
  }

  return __assign.apply(this, arguments)
}

exports.__esModule = true

let snapshotCore = require('snap-shot-core')
let _ = require('lodash')
let Snapshot = /** @class */ (function () {
  function Snapshot (on) {
    this.on = on
    this.snapshotIndex = {}
    this.snapshotRestore = function () {
      return null
    }
    // export function
    this.getSnapshot = function (opts) {
      let result = null

      opts = _.defaults(opts, {
        what: 'aaaaa',
      })
      opts = _.assign(opts, {
        compare (_a) {
          let expected = _a.expected, value = _a.value

          result = expected
          throw new Error('bail')
        },
        opts: {
          update: false,
          ci: true,
        },
      })
      try {
        snapshotCore.core(__assign({}, opts))
      } catch (e) {
      }

      return result
    }
    this.saveSnapshot = function (opts) {
      opts = _.defaults(opts, {
        // exactSpecName: `${opts.specName} #${this.snapshotIndex[opts.specName]}`,
      })

      return snapshotCore.core(__assign({}, opts, { opts: {
        update: true,
      } }))
    }
  }

  return Snapshot
}())

exports.Snapshot = Snapshot
