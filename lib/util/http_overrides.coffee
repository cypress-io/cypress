net     = require("net")
dns     = require("dns")
http    = require("http")
Promise = require("bluebird")

cache      = {}
onSocket   = http.ClientRequest.prototype.onSocket
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
  ## this does not go out to the network to figure
  ## out the addresess. in fact it respects the /etc/hosts file
  ## https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
  ## https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
  dns.lookup options.host, {all: true}, (err, addresses) ->
    ## if we got an actual error in dns lookup
    ## then just go ahead and make the request
    ## so this bubbles up correctly
    return makeRequest() if err

    connect = (address) ->
      ## https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
      new Promise (resolve, reject) ->
        client = net.connect(options.port, address.address)
        client.on "connect", ->
          client.end()
          resolve(address)
        client.on "error", reject

    ## the first net.connect which resolves
    ## should be cached and the request should
    ## be immediately made
    Promise
    .try ->
      addresses.map(connect)
    .any()
    .then (address) ->
      setCache(options, address.family)
      options.family = address.family
    .then(makeRequest)
    .catch(makeRequest)