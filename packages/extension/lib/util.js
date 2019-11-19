module.exports = {
  getCookieUrl: (cookie = {}) => {
    const prefix = cookie.secure ? 'https://' : 'http://'

    return prefix + cookie.domain + (cookie.path || '')
  },
}
