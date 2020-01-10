moment   = require("moment")
parser   = require("cookie-parser")
e2e      = require("../support/helpers/e2e")
humanInterval = require("human-interval")

onServer = (app) ->
  app.use(parser())

  app.get "/logout", (req, res) ->
    res.send("<html>logged out</html>")

  app.all "/requestCookies", (req, res) ->
    res.send(req.cookies)

  app.all "/requestCookiesHtml", (req, res) ->
    res.type('html').send(req.cookies)

  app.get "/set", (req, res) ->
    res.cookie("shouldExpire", "endOfsession")

    res.send("<html></html>")

  app.get "/setOneHourFromNowAndSecure", (req, res) ->
    res.cookie("shouldExpire", "oneHour", {
      secure: true
      maxAge: humanInterval("1 hour")
    })

    res.send("<html></html>")

  app.get "/expirationRedirect", (req, res) ->
    res.cookie("shouldExpire", "now", {
      ## express maxAge is relative to current time
      ## in milliseconds
      maxAge: 0
    })

    res.redirect("/logout")

  app.get "/expirationMaxAge", (req, res) ->
    res.header("Set-Cookie",
      "shouldExpire=; Max-Age=0; Path=/; Expires=Sun, 24 Jun 1997 20:36:13 GMT"
    )
    ## response to set
    # auth=p1_2FruNr1entizk9QEGHFYQlWjIK5LULzdDj17lkYhZTz7XA5GOfnVgbbeBDAqnfImkwof2qz0M3yi3AUVusKPqh1BRK6253h0kiBENwdjWDsx3mYQQKpHn6o3XOXX7poSkzrHThnrDlH4w9zoLItwIVNhR2hQrCYhQhtHuw20YM_3D; Domain=.surveymonkey.com;Max-Age=3600; Path=/; expires=Fri, 26-Oct-2018 06:13:48 GMT; secure; HttpOnly'

    ## response to clear
    # auth=; Domain=.surveymonkey.com; Max-Age=0; Path=/; expires=Wed, 31-Dec-97 23:59:59 GMT

    res.send("<html></html>")

  app.get "/expirationExpires", (req, res) ->
    res.cookie("shouldExpire", "now", {
      expires: moment().subtract(1, "day").toDate()
    })

    res.send("<html></html>")

  app.get "/cookieWithNoName", (req, res) ->
    res.header("Set-Cookie",
      "=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/"
    )

    res.send("<html></html>")

  app.get "/invalidCookies", (req, res) ->
    res.header("Set-Cookie", "foo=bar; domain=nope.not.this.one")

    res.send("<html></html>")

  app.get "/setCascadingCookies", (req, res) ->
    n = Number(req.query.n)

    ## alternates between base URLs
    a = req.query.a
    b = req.query.b

    res.header("Set-Cookie", [
      "namefoo#{n}=valfoo#{n}"
      "namebar#{n}=valbar#{n}"
    ])

    console.log('to', a, 'from', b)

    if n > 0
      res.redirect("#{a}/setCascadingCookies?n=#{n-1}&a=#{b}&b=#{a}")

    res.send("<html>finished setting cookies</html>")

  app.get "/setDomainCookie", (req, res) ->
    res.setHeader("Set-Cookie", "domaincookie=foo; Domain=#{req.query.domain}")

    if req.query.redirect
      return res.redirect(req.query.redirect).end()

    return res.type('html').end()

haveRoot = !process.env.USE_HIGH_PORTS && process.geteuid() == 0

if not haveRoot
  console.warn('(e2e tests warning) You are not running as root; therefore, 2_cookies_spec cannot cover the case where the default (80/443) HTTP(s) port is used. Alternate ports (2121/2323) will be used instead.')

httpPort = 2121
httpsPort = 2323

if haveRoot
  httpPort = 80
  httpsPort = 443

otherDomain = "quux.bar.net"
otherUrl = "http://#{otherDomain}#{if haveRoot then '' else ":#{httpPort}"}"
otherHttpsUrl = "https://#{otherDomain}#{if haveRoot then '' else ":#{httpsPort}"}"

describe "e2e cookies", ->
  e2e.setup({
    servers: [{
      onServer
      port: httpPort
    }, {
      onServer
      port: httpsPort
      https: true
    }]
    settings: {
      hosts: {
        "*.foo.com": "127.0.0.1"
        "*.bar.net": "127.0.0.1"
      }
    }
  })

  ## this is a big chunky test that runs cookies_spec with all combinations of these:
  ## - cookies on `localhost`, fully-qualified-domain-name, and IP address domains
  ## - `https` baseurls, `http` baseurls, and no baseurls set
  ## - both default port 80/443 and custom ports (if you are running as root)
  ## - all browsers
  ## snapshots are combined to ensure that there is no difference in any of these situations
  [
    ["localhost", "localhost"],
    ["FQDN", "www.bar.foo.com"],
    ["IP", "127.0.0.1"],
  ]
  .forEach ([
    format,
    baseDomain,
  ]) =>
    context "with #{format} urls", ->
      httpUrl = "http://#{baseDomain}#{if haveRoot then '' else ":#{httpPort}"}"
      httpsUrl = "https://#{baseDomain}#{if haveRoot then '' else ":#{httpsPort}"}"

      [
        [httpUrl, false],
        [httpsUrl, true]
      ].forEach ([
        baseUrl,
        https
      ]) ->
        e2e.it "passes with baseurl: #{baseUrl}", {
          config: {
            baseUrl
            env: {
              baseUrl
              expectedDomain: baseDomain
              https
              httpUrl
              httpsUrl
              otherUrl
              otherHttpsUrl
            }
          }
          spec: "cookies_spec_baseurl.coffee"
          snapshot: true
          expectedExitCode: 0
          onRun: (exec) =>
            exec({
              originalTitle: "e2e cookies with baseurl"
            })
        }

      e2e.it "passes with no baseurl", {
        config: {
          env: {
            httpUrl
            httpsUrl
          }
        }
        originalTitle: "e2e cookies with no baseurl"
        spec: "cookies_spec_no_baseurl.coffee"
        snapshot: true
        expectedExitCode: 0
      }
