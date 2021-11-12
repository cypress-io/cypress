import _ from 'lodash'
import capitalize from 'underscore.string/capitalize'
import minimatch from 'minimatch'

import $errUtils from './error_utils'
import $XHR from './xml_http_request'
import { makeContentWindowListener } from './events'

const regularResourcesRe = /\.(jsx?|coffee|html|less|s?css|svg)(\?.*)?$/
const needsDashRe = /([a-z][A-Z])/g
const props = 'onreadystatechange onload onerror'.split(' ')

const ignore = (xhr) => {
  const url = new URL(xhr.url)

  // https://github.com/cypress-io/cypress/issues/7280
  // we want to strip the xhr's URL of any hash and query params before
  // checking the REGEX for matching file extensions
  url.search = ''
  url.hash = ''

  // allow if we're GET + looks like we're fetching regular resources
  return xhr.method === 'GET' && regularResourcesRe.test(url.href)
}

const serverDefaults = {
  xhrUrl: '',
  method: 'GET',
  delay: 0,
  status: 200,
  headers: null,
  response: null,
  enable: true,
  autoRespond: true,
  waitOnResponses: Infinity,
  force404: false, // to force 404's for non-stubbed routes
  onAnyAbort: undefined,
  onAnyRequest: undefined,
  onAnyResponse: undefined,
  urlMatchingOptions: { matchBase: true },
  stripOrigin: _.identity,
  getUrlOptions: _.identity,
  ignore, // function whether to allow a request to go out (css/js/html/templates) etc
  onOpen () {},
  onSend () {},
  onXhrAbort () {},
  onXhrCancel () {},
  onError () {},
  onLoad () {},
  onFixtureError () {},
  onNetworkError () {},
}

// override the defaults for all servers
export const defaults = (obj = {}) => {
  // merge obj into defaults
  return _.extend(serverDefaults, obj)
}

export class Server {
  options: any

  private xhrs: Record<string, any> = {}
  private proxies: Record<string, any> = {}
  private routes: Array<any> = []
  private hasEnabledStubs = false
  private restoreFn: (() => void) | null = null

  private enableStubs (bool = true) {
    return this.hasEnabledStubs = bool
  }

  private setHeader (xhr, key, val, transformer?) {
    if (val != null) {
      if (transformer) {
        val = transformer(val)
      }

      key = `X-Cypress-${capitalize(key)}`

      return xhr.setRequestHeader(key, encodeURI(val))
    }
  }

  private normalize (val) {
    val = val.replace(needsDashRe, (match) => {
      return `${match[0]}-${match[1]}`
    })

    return val.toLowerCase()
  }

  private responseTypeIsTextOrEmptyString (responseType) {
    return responseType === '' || responseType === 'text'
  }

  // when the browser naturally cancels/aborts
  // an XHR because the window is unloading
  // on chrome < 71
  private isAbortedThroughUnload (xhr) {
    return xhr.canceled !== true &&
    xhr.readyState === 4 &&
    xhr.status === 0 &&
    // responseText may be undefined on some responseTypes
    // https://github.com/cypress-io/cypress/issues/3008
    // TODO: How do we want to handle other responseTypes?
    this.responseTypeIsTextOrEmptyString(xhr.responseType) &&
    xhr.responseText === ''
  }

  constructor (options: any = {}) {
    this.options = _.defaults(options, serverDefaults)

    // The function below is used as a callback for lodash to cancel any pending xhrs
    this.cancelXhr = this.cancelXhr.bind(this)
  }

  restore () {
    if (this.restoreFn) {
      this.restoreFn()

      this.restoreFn = null
    }
  }

  getStack () {
    const err = new Error

    return err.stack!.split('\n').slice(3).join('\n')
  }

  get404Route () {
    return {
      status: 404,
      response: '',
      delay: 0,
      headers: null,
      is404: true,
    }
  }

  transformHeaders (headers) {
    // normalize camel-cased headers key
    headers = _.reduce(headers, (memo, value, key) => {
      memo[this.normalize(key)] = value

      return memo
    }, {})

    return JSON.stringify(headers)
  }

  normalizeStubUrl (xhrUrl, url) {
    if (!xhrUrl) {
      $errUtils.warnByPath('server.xhrurl_not_set')
    }

    // always ensure this is an absolute-relative url
    // and remove any double slashes
    xhrUrl = _.compact(xhrUrl.split('/')).join('/')
    url = _.trimStart(url, '/')

    return [`/${xhrUrl}`, url].join('/')
  }

  getFullyQualifiedUrl (contentWindow, url) {
    // the href getter will always resolve a full path
    const a = contentWindow.document.createElement('a')

    a.href = url

    return a.href
  }

  getOptions () {
    // clone the options to prevent
    // accidental mutations
    return _.clone(this.options)
  }

  getRoutes () {
    return this.routes
  }

  isIgnored (xhr) {
    return this.options.ignore(xhr)
  }

  shouldApplyStub (route) {
    return this.hasEnabledStubs && route && (route.response != null)
  }

  applyStubProperties (xhr, route) {
    const responser = _.isObject(route.response) ? JSON.stringify : null

    // add header properties for the xhr's id
    this.setHeader(xhr, 'id', xhr.id)

    this.setHeader(xhr, 'status', route.status)
    this.setHeader(xhr, 'response', route.response, responser)
    this.setHeader(xhr, 'matched', `${route.url}`)
    this.setHeader(xhr, 'delay', route.delay)
    this.setHeader(xhr, 'headers', route.headers, this.transformHeaders.bind(this))
  }

  route (attrs = {}) {
    // merge attrs with the server's defaults
    // so we preserve the state of the attrs
    // at the time they're created since we
    // can create another server later

    // dont mutate the original attrs
    const route = _.defaults(
      {},
      attrs,
      _.pick(this.options, 'delay', 'method', 'status', 'autoRespond', 'waitOnResponses', 'onRequest', 'onResponse'),
    )

    this.routes.push(route)

    return route
  }

  getRouteForXhr (xhr) {
    // return the 404 stub if we dont have any stubs
    // but we are stubbed - meaning we havent added any routes
    // but have started the server
    // and this request shouldnt be allowed
    if (!this.routes.length && this.hasEnabledStubs &&
      this.options.force404 !== false && !this.isIgnored(xhr)) {
      return this.get404Route()
    }

    // bail if we've attached no stubs
    if (!this.routes.length) {
      return null
    }

    // bail if this xhr matches our ignore list
    if (this.isIgnored(xhr)) {
      return null
    }

    // loop in reverse to get
    // the first matching stub
    // thats been most recently added
    for (let i = this.routes.length - 1; i >= 0; i--) {
      const route = this.routes[i]

      if (this.xhrMatchesRoute(xhr, route)) {
        return route
      }
    }

    // else if no stub matched
    // send 404 if we're allowed to
    if (this.options.force404) {
      return this.get404Route()
    }

    // else return null
    return null
  }

  methodsMatch (routeMethod, xhrMethod) {
    // normalize both methods by uppercasing them
    return routeMethod.toUpperCase() === xhrMethod.toUpperCase()
  }

  urlsMatch (routePattern, fullyQualifiedUrl) {
    const match = (str, pattern) => {
      // be nice to our users and prepend
      // pattern with "/" if it doesnt have one
      // and str does
      if (pattern[0] !== '/' && str[0] === '/') {
        pattern = `/${pattern}`
      }

      return minimatch(str, pattern, this.options.urlMatchingOptions)
    }

    const testRe = (url1, url2) => {
      return routePattern.test(url1) || routePattern.test(url2)
    }

    const testStr = (url1, url2) => {
      return (routePattern === url1) || (routePattern === url2) ||
        match(url1, routePattern) || match(url2, routePattern)
    }

    if (_.isRegExp(routePattern)) {
      return testRe(fullyQualifiedUrl, this.options.stripOrigin(fullyQualifiedUrl))
    }

    return testStr(fullyQualifiedUrl, this.options.stripOrigin(fullyQualifiedUrl))
  }

  xhrMatchesRoute (xhr, route) {
    return this.methodsMatch(route.method, xhr.method) && this.urlsMatch(route.url, xhr.url)
  }

  add (xhr, attrs = {}) {
    const id = _.uniqueId('xhr')

    _.extend(xhr, attrs)
    xhr.id = id
    this.xhrs[id] = xhr
    this.proxies[id] = $XHR.create(xhr)

    return this.proxies[id]
  }

  getProxyFor (xhr) {
    return this.proxies[xhr.id]
  }

  abortXhr (xhr) {
    const proxy = this.getProxyFor(xhr)

    // if the XHR leaks into the next test
    // after we've reset our internal server
    // then this may be undefined
    if (!proxy) {
      return
    }

    // return if we're already aborted which
    // can happen if the browser already canceled
    // this xhr but we called abort later
    if (xhr.aborted) {
      return
    }

    xhr.aborted = true

    const abortStack = this.getStack()

    proxy.aborted = true

    this.options.onXhrAbort(proxy, abortStack)

    if (_.isFunction(this.options.onAnyAbort)) {
      const route = this.getRouteForXhr(xhr)

      // call the onAnyAbort function
      // after we've called options.onSend
      return this.options.onAnyAbort(route, proxy)
    }
  }

  cancelXhr (xhr) {
    const proxy = this.getProxyFor(xhr)

    // if the XHR leaks into the next test
    // after we've reset our internal server
    // then this may be undefined
    if (!proxy) {
      return
    }

    xhr.canceled = true

    proxy.canceled = true

    this.options.onXhrCancel(proxy)

    return xhr
  }

  cancelPendingXhrs () {
    // cancel any outstanding xhr's
    // which aren't already complete
    // or already canceled
    return _
    .chain(this.xhrs)
    .reject({ readyState: 4 })
    .reject({ canceled: true })
    .map(this.cancelXhr)
    .value()
  }

  set (obj) {
    // whitelist is deprecated.
    if (obj.whitelist) {
      return $errUtils.throwErrByPath('server.whitelist_renamed', { args: { type: 'server' } })
    }

    // handle enable=true|false
    if (obj.enable != null) {
      this.enableStubs(obj.enable)
    }

    return _.extend(this.options, obj)
  }

  bindTo (contentWindow) {
    this.restore()

    const XHR = contentWindow.XMLHttpRequest
    const { send, open, abort } = XHR.prototype
    const srh = XHR.prototype.setRequestHeader

    const bridgeContentWindowListener = makeContentWindowListener('cypressXhrBridge', contentWindow)

    this.restoreFn = () => {
      // restore the property back on the window
      return _.each(
        { send, open, abort, setRequestHeader: srh },
        (value, key) => {
          return XHR.prototype[key] = value
        },
      )
    }

    // we need this because of the non-arrow functions below.
    const server = this

    XHR.prototype.setRequestHeader = function (...args) {
      // if the XHR leaks into the next test
      // after we've reset our internal server
      // then this may be undefined
      const proxy = server.getProxyFor(this)

      if (proxy) {
        proxy._setRequestHeader.apply(proxy, args)
      }

      return srh.apply(this, args)
    }

    XHR.prototype.abort = function (...args) {
      // if we already have a readyState of 4
      // then do not get the abort stack or
      // set the aborted property or call onXhrAbort
      // to test this just use a regular XHR
      if (this.readyState !== 4) {
        server.abortXhr(this)
      }

      return abort.apply(this, args)
    }

    XHR.prototype.open = function (method, url, async = true, username, password) {
      // get the fully qualified url that normally the browser
      // would be sending this request to

      // FQDN:               http://www.google.com/responses/users.json
      // relative:           partials/phones-list.html
      // absolute-relative:  /app/partials/phones-list.html
      const fullyQualifiedUrl = server.getFullyQualifiedUrl(contentWindow, url)

      // decode the entire url.display to make
      // it easier to do assertions
      const proxy = server.add(this, {
        method,
        url: decodeURIComponent(fullyQualifiedUrl),
      })

      // if this XHR matches a stubbed route then shift
      // its url to the stubbed url and set the request
      // headers for the response
      const route = server.getRouteForXhr(this)

      if (server.shouldApplyStub(route)) {
        url = server.normalizeStubUrl(server.options.xhrUrl, fullyQualifiedUrl)
      }

      const timeStart = new Date

      const xhr = this
      const fns: Record<string, any> = {}
      const overrides: Record<string, any> = {}

      const bailIfRecursive = (fn) => {
        let isCalled = false

        return (...args) => {
          if (isCalled) {
            return
          }

          isCalled = true
          try {
            return fn.apply(contentWindow, args)
          } finally {
            isCalled = false
          }
        }
      }

      const onLoadFn = function (...args) {
        proxy._setDuration(timeStart)
        proxy._setStatus()
        proxy._setResponseHeaders()
        proxy._setResponseBody()

        let err = proxy._getFixtureError()

        if (err) {
          return server.options.onFixtureError(proxy, err)
        }

        // catch synchronous errors caused
        // by the onload function
        try {
          const ol = fns.onload

          if (_.isFunction(ol)) {
            ol.apply(xhr, args)
          }

          server.options.onLoad(proxy, route)
        } catch (error) {
          err = error
          server.options.onError(proxy, err)
        }

        if (_.isFunction(server.options.onAnyResponse)) {
          return server.options.onAnyResponse(route, proxy)
        }
      }

      const onErrorFn = function (...args) {
        // its possible our real onerror handler
        // throws so we need to catch those errors too
        try {
          const oe = fns.onerror

          if (_.isFunction(oe)) {
            oe.apply(xhr, args)
          }

          return server.options.onNetworkError(proxy)
        } catch (err) {
          return server.options.onError(proxy, err)
        }
      }

      const onReadyStateFn = function (...args) {
        // catch synchronous errors caused
        // by the onreadystatechange function
        try {
          const orst = fns.onreadystatechange

          if (server.isAbortedThroughUnload(xhr)) {
            server.abortXhr(xhr)
          }

          if (_.isFunction(orst)) {
            return orst.apply(xhr, args)
          }
        } catch (err) {
          // its failed stop sending the callack
          xhr.onreadystatechange = null

          return server.options.onError(proxy, err)
        }
      }

      // bail if eventhandlers have already been called to prevent
      // infinite recursion
      overrides.onload = bridgeContentWindowListener(bailIfRecursive(onLoadFn))
      overrides.onerror = bridgeContentWindowListener(bailIfRecursive(onErrorFn))
      overrides.onreadystatechange = bridgeContentWindowListener(bailIfRecursive(onReadyStateFn))

      props.forEach((prop) => {
        // if we currently have one of these properties then
        // back them up!
        const fn = xhr[prop]

        if (fn) {
          fns[prop] = fn
        }

        // set the override now
        xhr[prop] = overrides[prop]

        // and in the future if this is redefined
        // then just back it up
        return Object.defineProperty(xhr, prop, {
          get () {
            const bak = fns[prop]

            if (_.isFunction(bak)) {
              return (...args) => {
                return bak.apply(xhr, args)
              }
            }

            return overrides[prop]
          },
          set (fn) {
            fns[prop] = fn
          },
          configurable: true,
        })
      })

      server.options.onOpen(method, url, async, username, password)

      // change absolute url's to relative ones
      // if they match our baseUrl / visited URL
      return open.call(this, method, url, async, username, password)
    }

    XHR.prototype.send = function (requestBody) {
      // if there is an existing route for this
      // XHR then add those properties into it
      // only if route isnt explicitly false
      // and the server is enabled
      const route = server.getRouteForXhr(this)

      if (server.shouldApplyStub(route)) {
        server.applyStubProperties(this, route)
      }

      // capture where this xhr came from
      const sendStack = server.getStack()

      // get the proxy xhr
      const proxy = server.getProxyFor(this)

      proxy._setRequestBody(requestBody)

      // log this out now since it's being sent officially
      // unless its not been ignored
      if (!server.isIgnored(this)) {
        server.options.onSend(proxy, sendStack, route)
      }

      if (_.isFunction(server.options.onAnyRequest)) {
        // call the onAnyRequest function
        // after we've called options.onSend
        server.options.onAnyRequest(route, proxy)
      }

      // eslint-disable-next-line prefer-rest-params
      return send.apply(this, arguments)
    }
  }
}

// Left behind for backwards compatibility
// When cy.server() is moved to a plugin, this might be safely removed.
export default {
  create (options = {}) {
    return new Server(options)
  },
  defaults,
}
