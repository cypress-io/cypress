import _ from 'lodash'
import moment from 'moment'
import gravatar from 'gravatar'

module.exports = {
  osIcon: (osName) => {
    switch (osName) {
      case 'windows':
        return 'windows'
      case 'darwin':
        return 'apple'
      default:
        return ''
    }
  },

  osNameFormatted: (osName) => {
    let name

    switch (osName) {
      case 'windows':
        name = 'windows'
        break
      case 'darwin':
        name = 'apple'
        break
      default:
        name = ''
        break
    }

    return _.capitalize(name)
  },

  browserIcon: (browserName) => {
    switch (browserName) {
      case 'chrome':
        return 'chrome'
      case 'firefox':
        return 'firefox'
      case 'safari':
        return 'firefox'
      default:
        return ''
    }
  },

  browserNameFormatted: (browserName) => {
    let name

    switch (browserName) {
      case 'chrome':
        name = 'chrome'
        break
      case 'firefox':
        name = 'firefox'
        break
      case 'safari':
        name = 'firefox'
        break
      default:
        name = ''
        break
    }

    return _.capitalize(name)
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
