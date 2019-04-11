const _write = process.stdout.write
const _ = require('lodash')
const stripAnsi = require('strip-ansi')
const debug = require('debug')('utils')
const chalk = require('chalk')

const stdout = {
  capture () {
    const logs = []

    const write = process.stdout.write

    process.stdout.write = function (str) {

      logs.push(str)

      const args = (args) => {
        debug.extend('stdout')(...args)

        return _.map(_.map(args, stripAnsi), (v) => _.isString(v) && chalk.rgb(160, 100, 160)(v))

      }

      write.apply(this, args(arguments))
    }

    return {
      data: logs,

      toString: () => {
        return stripAnsi(logs.join(''))
      },
    }
  },

  restore () {
    process.stdout.write = _write
  },
}

const spyOn = (obj, prop, fn) => {
  const _fn = obj[prop]

  const stub = sinon.stub(obj, prop)
  .callsFake(function () {

    const args = fn.apply(this, arguments)

    let ret = _fn.apply(this, args || arguments)

    return ret

  })

  return stub
}

module.exports = {
  spyOn,
  stdout,
}
