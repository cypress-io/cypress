_           = require("lodash")
url         = require("url")
debug       = require("debug")("cypress:server:cors")
parseDomain = require("parse-domain")

ipAddressRe = /^[\d\.]+$/

module.exports = {
  parseUrlIntoDomainTldPort: (str) ->
    {hostname, port, protocol} = url.parse(str)

    port ?= if protocol is "https:" then "443" else "80"

    ## if we couldn't get a parsed domain
    if not parsed = parseDomain(hostname, {
      privateTlds: true ## use the public suffix
      customTlds: ipAddressRe
    })

      ## then just fall back to a dumb check
      ## based on assumptions that the tld
      ## is the last segment after the final
      ## '.' and that the domain is the segment
      ## before that
      segments = hostname.split(".")

      parsed = {
        tld:    segments[segments.length - 1] ? ""
        domain: segments[segments.length - 2] ? ""
      }

    obj = {}
    obj.port     = port
    obj.tld      = parsed.tld
    obj.domain   = parsed.domain
    # obj.protocol = protocol

    debug("Parsed URL %o", obj)

    return obj

  urlMatchesOriginPolicyProps: (url, props) ->
    ## take a shortcut here in the case
    ## where remoteHostAndPort is null
    return false if not props

    parsedUrl = @parseUrlIntoDomainTldPort(url)

    ## does the parsedUrl match the parsedHost?
    _.isEqual(parsedUrl, props)
}
