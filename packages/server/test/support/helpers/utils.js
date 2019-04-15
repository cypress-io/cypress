const _write = process.stdout.write
const _ = require('lodash')
const stripAnsi = require('strip-ansi')
const debug = require('debug')('utils')
const chalk = require('chalk')

const spyStdout = (obj, props) =>
  spyOn(obj, props, () => stdout.capture(), (ret) => {
    if (ret && ret.isPending) {
      return ret.tap(() => {
        stdout.restore()
      })
    }

    stdout.restore()

    return
  })

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

const spyOn = (obj, props, fn, fn2) => {
  if (_.isString(props)) {
    props = [props]
  }

  const rets = _.map(props, (prop) => {

    const _fn = obj[prop]

    const stub = obj[prop] = sinon.stub()
    .callsFake(function () {

      fn && fn.apply(this, arguments)

      let ret = _fn.apply(this, arguments)

      if (fn2) {
        const fn2_ret = fn2.apply(this, [ret])

        if (!_.isUndefined(fn2_ret)) {
          ret = fn2_ret
        }
      }

      return ret

    })

    return stub
  })

  if (rets.length === 1) return rets[0]

  return rets

}

module.exports = {
  spyOn,
  stdout,
  spyStdout,
}
