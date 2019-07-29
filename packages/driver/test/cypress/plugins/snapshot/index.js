const snapshotCore = require('snap-shot-core')
const _ = require('lodash')

/**
 *
 * @param {{what: any, file: string, exactSpecName: string, store?: Function compare?: Function}}
	*/
const getSnapshot = (opts) => {
  let result = null

  opts = _.defaults(opts, {
    what: 'aaaaa',
  })

  opts = _.assign(opts, {
    compare: ({ expected }) => {
      result = expected
      throw new Error('bail')
    },
    opts: {
      update: false,
      ci: true,
    },
  })

  try {
    snapshotCore.core(
      _.extend(
        {},
        opts,
      )
    )
  } catch (e) {
    null
  }

  return result

}

const saveSnapshot = (opts) => {
  opts = _.defaults(opts, {
  })

  return snapshotCore.core(_.extend({},
    opts,
    {
      opts: {
        update: true,
      },
    }))
}

module.exports = {
  saveSnapshot,
  getSnapshot,
}
