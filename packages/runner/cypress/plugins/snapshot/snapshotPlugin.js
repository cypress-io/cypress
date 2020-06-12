const snapshotCore = require('snap-shot-core')
const _ = require('lodash')

// TODO: prune snapshots

/**
 *
 * @param {{what: any, file: string, exactSpecName: string, store?: Function compare?: Function}}
	*/
const getSnapshot = (opts) => {
  let result = null

  // HACK: in order to read the snapshot from disk using snap-shot-core
  // we have to 'fake save' a snapshot, and intercept the stored value via custom compare fn
  opts = _.defaults(opts, {
    what: '[placeholder]',
  })

  opts = _.assign(opts, {
    compare: ({ expected }) => {
      result = expected
      throw new Error('bail')
    },
    ext: '.js',
    opts: {
      update: false,
      ci: true,
    },
  })

  try {
    snapshotCore.core({ ...opts })
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
      ext: '.js',
      opts: {
        update: true,
      },
    }))
}

module.exports = {
  saveSnapshot,
  getSnapshot,
}
