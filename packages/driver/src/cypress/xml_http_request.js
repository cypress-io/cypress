const $errUtils = require('./error_utils')

const isCypressHeaderRe = /^X-Cypress-/i

const parseJSON = function (text) {
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
    return this.xhr != null ? this.xhr : $errUtils.throwErrByPath('xhr.missing')
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

    this.response.body =
      (() => {
        try {
          return parseJSON(this.xhr.responseText)
        } catch (e) {
          return this.xhr.response
        }
      })()
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
    let err
    const body = this.response && this.response.body

    if (body && (err = body.__error)) {
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

  setRequestHeader () {
    return this.xhr.setRequestHeader.apply(this.xhr, arguments)
  }

  getResponseHeader () {
    return this.xhr.getResponseHeader.apply(this.xhr, arguments)
  }

  getAllResponseHeaders () {
    return this.xhr.getAllResponseHeaders.apply(this.xhr, arguments)
  }

  static add (xhr) {
    return new XMLHttpRequest(xhr)
  }
}

Object.defineProperties(XMLHttpRequest.prototype, {
  requestHeaders: {
    get () {
      return (this.request != null ? this.request.headers : undefined)
    },
  },

  requestBody: {
    get () {
      return (this.request != null ? this.request.body : undefined)
    },
  },

  responseHeaders: {
    get () {
      return (this.response != null ? this.response.headers : undefined)
    },
  },

  responseBody: {
    get () {
      return (this.response != null ? this.response.body : undefined)
    },
  },

  requestJSON: {
    get () {
      $errUtils.warnByPath('xhr.requestjson_deprecated')

      return this.requestBody
    },
  },

  responseJSON: {
    get () {
      $errUtils.warnByPath('xhr.responsejson_deprecated')

      return this.responseBody
    },
  },
})

const create = (xhr) => new XMLHttpRequest(xhr)

module.exports = {
  create,
}
