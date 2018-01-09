import _ from 'lodash'
import moment from 'moment'
import gravatar from 'gravatar'

const osNameLookup = {
  darwin: 'apple',
}

const osIconLookup = {
  windows: 'windows',
  darwin: 'apple',
  linux: 'linux',
}

const browserNameLookup = {}

const browserIconLookup = {
  chrome: 'chrome',
  chromium: 'chrome',
  canary: 'chrome',
  electron: 'chrome',
  firefox: 'firefox',
  safari: 'safari',
}

module.exports = {
  osIcon: (osName) => {
    if (!osName) return ''

    return osIconLookup[osName] || 'desktop'
  },

  osNameFormatted: (osName) => {
    if (!osName) return ''

    return _.capitalize(osNameLookup[osName] || osName)
  },

  browserIcon: (browserName) => {
    if (!browserName) return ''

    return browserIconLookup[browserName] || 'globe'
  },

  browserNameFormatted: (browserName) => {
    if (!browserName) return ''

    return _.capitalize(browserNameLookup[browserName] || browserName)
  },


  browserVersionFormatted: (browserVersion) => {
    if (!browserVersion) return ''

    // looks like: '53.0.2785.143'
    return browserVersion.split('.')[0]
  },

  gravatarUrl: (email) => {
    let opts = { size: '13', default: 'mm' }

    if (!email) { opts.forcedefault = 'y' }

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

  durationFormatted: (durationInMs) => {
    const duration = moment.duration(durationInMs)

    let durationHours = duration.hours() ? `${duration.hours()}h ` : ''
    let durationMinutes = duration.minutes() ? `${duration.minutes()}m ` : ''
    let durationSeconds = duration.seconds() ? `${duration.seconds()}s ` : ''

    return durationHours + durationMinutes + durationSeconds
  },
}
