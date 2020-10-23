const $errUtils = require('./error_utils')

const isCypressHeaderRe = /^X-Cypress-/i

const parseJSON = (text) => {
  try {
    return JSON.parse(text)
  } catch (error) {
    return text
  }
}

// maybe rename this to XMLHttpRequest ?
// so it shows up correctly as an instance in the console
class XMLHttpRequest {
  constructor (xhr) {
    this.xhr = xhr
    this.id = this.xhr.id
    this.url = this.xhr.url
    this.method = this.xhr.method
    this.status = null
    this.statusMessage = null
    this.request = {}
    this.response = null
  }

  _getXhr () {
    this.xhr = this.xhr ?? $errUtils.throwErrByPath('xhr.missing')

    return this.xhr
  }

  _setDuration (timeStart) {
    this.duration = (new Date) - timeStart
  }

  _setStatus () {
    this.status = this.xhr.status
    this.statusMessage = `${this.xhr.status} (${this.xhr.statusText})`
  }

  _setRequestBody (requestBody = null) {
    this.request.body = parseJSON(requestBody)
  }

  _setResponseBody () {
    if (this.response == null) {
      this.response = {}
    }

    try {
      this.response.body = parseJSON(this.xhr.responseText)
    } catch (e) {
      this.response.body = this.xhr.response
    }
  }

  _setResponseHeaders () {
    // parse response header string into object
    // https://gist.github.com/monsur/706839
    const headerStr = this.xhr.getAllResponseHeaders()

    const set = (resp) => {
      if (this.response == null) {
        this.response = {}
      }

      this.response.headers = resp
    }

    const headers = {}

    if (!headerStr) {
      return set(headers)
    }

    const headerPairs = headerStr.split('\u000d\u000a')

    for (let headerPair of headerPairs) {
      // Can't use split() here because it does the wrong thing
      // if the header value has the string ": " in it.
      const index = headerPair.indexOf('\u003a\u0020')

      if (index > 0) {
        const key = headerPair.substring(0, index)
        const val = headerPair.substring(index + 2)

        headers[key] = val
      }
    }

    return set(headers)
  }

  _getFixtureError () {
    const err = this.response?.body?.__error

    if (err) {
      return err
    }
  }

  _setRequestHeader (key, val) {
    if (isCypressHeaderRe.test(key)) {
      return
    }

    if (this.request.headers == null) {
      this.request.headers = {}
    }

    const current = this.request.headers[key]

    // if we already have a request header
    // then prepend val with ', '
    if (current) {
      val = `${current}, ${val}`
    }

    this.request.headers[key] = val
  }

  setRequestHeader (...args) {
    return this.xhr.setRequestHeader.apply(this.xhr, args)
  }

  getResponseHeader (...args) {
    return this.xhr.getResponseHeader.apply(this.xhr, args)
  }

  getAllResponseHeaders (...args) {
    return this.xhr.getAllResponseHeaders.apply(this.xhr, args)
  }

  static add (xhr) {
    return new XMLHttpRequest(xhr)
  }
}

Object.defineProperties(XMLHttpRequest.prototype, {
  requestHeaders: {
    get () {
      return this.request?.headers
    },
  },

  requestBody: {
    get () {
      return this.request?.body
    },
  },

  responseHeaders: {
    get () {
      return this.response?.headers
    },
  },

  responseBody: {
    get () {
      return this.response?.body
    },
  },
})

const create = (xhr) => {
  return new XMLHttpRequest(xhr)
}

module.exports = {
  create,
}
