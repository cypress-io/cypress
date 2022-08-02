module.exports = {
  getCookieUrl: (cookie = {}) => {
    const prefix = cookie.secure ? 'https://' : 'http://'

    // https://github.com/cypress-io/cypress/issues/6375
    const host = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain

    return prefix + host + (cookie.path || '')
  },
}
