const http = require('http')
const connect = require('./connect')

const cache = {}
const { addRequest } = http.Agent.prototype

const setCache = (options, family) => {
  return cache[`${options.host}:${options.port}`] = family
}

const getCachedFamily = (options) => {
  return cache[`${options.host}:${options.port}`]
}

// https://github.com/nodejs/node/blob/v5.1.1/lib/_http_agent.js#L110
http.Agent.prototype.addRequest = function (req, options) {
  const agent = this

  const makeRequest = () => {
    return addRequest.call(agent, req, options)
  }

  const family = getCachedFamily(options)

  // if we have a cached family for this
  // specific host + port then just
  // set that as the family and make
  // the request
  if (family) {
    options.family = family

    return makeRequest()
  }

  // else lets go ahead and make a dns lookup
  return connect
  .getAddress(options.port, options.host)
  .tap((address) => {
    // the first net.connect which resolves
    // should be cached and the request should
    // be immediately made
    setCache(options, address.family)
    options.family = address.family
  })
  .then(makeRequest)
  .catch(makeRequest)
}
