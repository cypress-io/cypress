http    = require("http")
connect = require("./connect")

cache      = {}
addRequest = http.Agent.prototype.addRequest

setCache = (options, family) ->
  cache[options.host + ":" + options.port] = family

getCachedFamily = (options) ->
  cache[options.host + ":" + options.port]

## https://github.com/nodejs/node/blob/v5.1.1/lib/_http_agent.js#L110
http.Agent.prototype.addRequest = (req, options) ->
  agent = @

  makeRequest = ->
    addRequest.call(agent, req, options)

  ## if we have a cached family for this
  ## specific host + port then just
  ## set that as the family and make
  ## the request
  if family = getCachedFamily(options)
    options.family = family
    return makeRequest()

  ## else lets go ahead and make a dns lookup
  connect.getAddress(options.port, options.host)
  .then (address) ->
    ## the first net.connect which resolves
    ## should be cached and the request should
    ## be immediately made
    setCache(options, address.family)
    options.family = address.family
  .then(makeRequest)
  .catch(makeRequest)
