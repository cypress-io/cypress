import _ from 'lodash'
import md5 from 'md5'

module.exports = {
  osIcon: (osName) => {
    switch (osName) {
      case 'window':
        return 'window'
      case 'darwin':
        return 'apple'
      default:
        return ''
    }
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

  commitEmailHash: (email) => {
    if (email) {
      const cleanEmail = _.lowerCase((email).trim())
      return md5(cleanEmail)
    }
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
}
