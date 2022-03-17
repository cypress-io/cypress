import snapshotCore from 'snap-shot-core'
import path from 'path'
import _ from 'lodash'

interface SnapshotOpts {
  what: any
  file: string
  exactSpecName: string
  store?: () => void
  compare?: () => void
}

/**
 *
 * @param {{what: any, file: string, exactSpecName: string, store?: Function compare?: Function}}
	*/
export const getSnapshot = (opts: SnapshotOpts) => {
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

export const saveSnapshot = (opts: SnapshotOpts) => {
  const snapshotDir = path.join(__dirname, '..', '..', '..', '__snapshots__')
  console.log({ snapshotDir })

  const snapshotOpts = _.extend({}, _.defaults(opts, {}), {
    ext: '.js',
    snapshotDir,
    useRelativePath: true,
    opts: {
      // update: true,
      snapshotDir,
      useRelativePath: true,
    },
  })

  console.log({ snapshotOpts })

  return snapshotCore.core(snapshotOpts)
}
