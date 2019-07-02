import _ from 'lodash'
import gravatar from 'gravatar'
import duration from '../../../server/lib/util/duration'

const cyDirRegex = /^cypress\/integration\//g

const osIconLookup = {
  win32: 'windows',
  darwin: 'apple',
  linux: 'linux',
}

const browserIconLookup = {
  chrome: 'chrome',
  Electron: 'chrome',
  firefox: 'firefox',
  safari: 'safari',
}

module.exports = {
  durationFormatted: duration.format,

  osIcon: (osName) => {
    if (!osName) return ''

    return osIconLookup[osName] || 'desktop'
  },

  browserIcon: (browserName) => {
    if (!browserName) return ''

    return browserIconLookup[browserName] || 'globe'
  },

  browserNameFormatted: (browserName) => {
    if (!browserName) return ''

    return _.capitalize(browserName)
  },

  browserVersionFormatted: (browserVersion) => {
    if (!browserVersion) return ''

    // looks like: '53.0.2785.143'
    return browserVersion.split('.')[0]
  },

  gravatarUrl: (email) => {
    let opts = { size: '13', default: 'mm' }

    if (!email) {
      opts.forcedefault = 'y'
    }

    return gravatar.url(email, opts, true)
  },

  getStatusIcon: (status) => {
    switch (status) {
      case 'errored':
        return 'exclamation-triangle'
      case 'failed':
        return 'exclamation-circle'
      case 'noTests':
        return 'ban'
      case 'passed':
        return 'check-circle'
      case 'running':
        return 'refresh fa-spin'
      case 'overLimit':
        return 'exclamation-triangle'
      case 'timedOut':
        return 'hourglass-end'
      case null:
        return 'terminal'
      default:
        return ''
    }
  },

  stripLeadingCyDirs (spec) {
    if (!spec) return null

    // remove leading 'cypress/integration' from spec
    return spec.replace(cyDirRegex, '')
  },

  stripSharedDirsFromDir2 (dir1, dir2, osName) {
    const sep = osName === 'win32' ? '\\' : '/'

    const arr1 = dir1.split(sep)
    const arr2 = dir2.split(sep)

    let found = false

    return _
    .chain(arr2)
    .transform((memo, segment, index) => {
      const segmentsFromEnd1 = arr1.slice(-(index + 1))
      const segmentsFromBeg2 = arr2.slice(0, index + 1)

      if (_.isEqual(segmentsFromBeg2, segmentsFromEnd1)) {
        return found = arr2.slice(index + 1)
      }

      if (found) {
        memo.push(...found)

        return false
      }
    })
    .join(sep)
    .value()
  },
}
