## THESE TESTS ARE COMMENTED OUT BECAUSE ALL OF REMOTE_INITIAL
## WAS REFACTORED AND MOST DO NOT APPLY.
## WILL ADD UNIT TESTS AS PROBLEMS ARISE (IF THEY ARISE)

root          = "../../../"
Server        = require("#{root}lib/server")
RemoteInitial = require("#{root}lib/controllers/remote_initial")
Readable      = require("stream").Readable
expect        = require("chai").expect
through       = require("through")
nock          = require('nock')
sinon         = require('sinon')
fs            = require('fs')

describe "Remote Initial", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(Server.prototype, "getCypressJson").returns({})

    @server = Server("/Users/brian/app")
    @app    = @server.app
    @server.setCypressJson {
      projectRoot: "/Users/brian/app"
    }

    @remoteInitial = RemoteInitial(@app)
#     @res = through (d) ->
#     @res.render = ->
#     @res.send = ->
#     @res.redirect = ->
#     @res.contentType = ->
#     @res.status = => @res

#     @baseUrl      = "http://foo.com"
#     @redirectUrl  = "http://x.com"

#     nock.disableNetConnect()

  afterEach ->
    @sandbox.restore()
#     nock.cleanAll()
#     nock.enableNetConnect()

  it "returns a new instance", ->
    expect(@remoteInitial).to.be.instanceOf(RemoteInitial)

  context "#getOriginFromFqdnUrl", ->
    beforeEach ->
      @urlIs = (url, remoteHost, reqUrl) ->
        @req = {url: url}
        url = @remoteInitial.getOriginFromFqdnUrl(@req)
        expect(url).to.eq remoteHost
        expect(@req.url).to.eq reqUrl

    it "returns origin from a FQDN url", ->
      @urlIs "/http://www.google.com", "http://www.google.com", "/"

    it "omits pathname, search, hash", ->
      @urlIs "/http://www.google.com/my/path?foo=bar#hash/baz", "http://www.google.com", "/my/path?foo=bar#hash/baz"

    it "does not alter req.url if not FQDN url", ->
      @urlIs "/foo/bar?baz=quux#hash/foo", undefined, "/foo/bar?baz=quux#hash/foo"

#   it "injects content", (done) ->
#     readable = new Readable

#     readable.push('<head></head><body></body>')
#     readable.push(null)

#     readable.pipe(@remoteInitial.injectContent("wow"))
#     .pipe through (d) ->
#       expect(d.toString()).to.eq("<head> wow</head><body></body>")
#       done()

#   describe "redirects", ->
#     beforeEach ->
#       @req = {
#         url: "/__remote/#{@baseUrl}/",
#         session: {}
#       }

#       nock(@baseUrl)
#       .get("/")
#       .reply(301, "", {
#         'location': @redirectUrl
#       })

#       @res.redirect = (loc) =>
#         @req.url = loc
#         @remoteInitial.handle(@req, @res)

#     it "redirects on 301", (done) ->
#       nock(@redirectUrl)
#       .get("/")
#       .reply(200, =>
#         done()
#       )

#       @remoteInitial.handle(@req, @res)

#     it "resets session remote after a redirect", (done) ->
#       nock(@redirectUrl)
#       .get("/")
#       .reply(200, =>
#         expect(@req.session.remote).to.eql("http://x.com")
#         done()
#       )

#       @remoteInitial.handle(@req, @res)

#   context "#parseReqUrl", ->
#     it "removes /__remote/", ->
#       url = @remoteInitial.parseReqUrl("/__remote/www.github.com")
#       expect(url).to.eq "www.github.com"

#     it "removes __initial query param", ->
#       url = @remoteInitial.parseReqUrl("/__remote/www.github.com?__initial=true")
#       expect(url).to.eq "www.github.com"

#     it "leaves other query params", ->
#       url = @remoteInitial.parseReqUrl("/__remote/www.github.com?__initial=true&foo=bar")
#       expect(url).to.eq "www.github.com/?foo=bar"

#     it "doesnt strip trailing slashes", ->
#       url = @remoteInitial.parseReqUrl("/__remote/www.github.com/")
#       expect(url).to.eq "www.github.com/"

#   context "#prepareUrlForRedirect", ->
#     it "prepends with /__remote/ and adds __initial=true query param", ->
#       url = @remoteInitial.prepareUrlForRedirect("www.github.com", "www.github.com/bar")
#       expect(url).to.eq "/__remote/www.github.com/bar?__initial=true"

#     it "doesnt strip leading slashes", ->
#       url = @remoteInitial.prepareUrlForRedirect("www.github.com", "www.github.com/")
#       expect(url).to.eq "/__remote/www.github.com/?__initial=true"

#     it "handles url leading slashes", ->
#       url = @remoteInitial.prepareUrlForRedirect("www.github.com/foo", "www.github.com/foo/")
#       expect(url).to.eq "/__remote/www.github.com/foo/?__initial=true"

#     it "handles existing query params", ->
#       url = @remoteInitial.prepareUrlForRedirect("www.github.com", "www.github.com/foo?bar=baz")
#       expect(url).to.eq "/__remote/www.github.com/foo?bar=baz&__initial=true"

#   context "setting session", ->
#     beforeEach ->
#       nock(@baseUrl)
#       .get("/")
#       .reply(200)

#       nock(@baseUrl)
#       .get("/?foo=bar")
#       .reply(200)

#     it "sets immediately before requests", ->
#       @req =
#         url: "/__remote/#{@baseUrl}"
#         session: {}

#       @remoteInitial.handle(@req, @res)

#       expect(@req.session.remote).to.eql(@baseUrl)

#     it "does not include query params in the url", ->
#       @req =
#         url: "/__remote/#{@baseUrl}?foo=bar"
#         session: {}

#       @remoteInitial.handle(@req, @res)
#       expect(@req.session.remote).to.eql(@baseUrl)

#   context "relative files", ->
#     it "#getRelativeFileContent strips trailing slashes", ->
#       createReadStream = @sandbox.stub(fs, "createReadStream")
#       @remoteInitial.getRelativeFileContent("index.html/", {})
#       expect(createReadStream).to.be.calledWith("/Users/brian/app/index.html")

#   context "absolute files", ->

#   context "file files", ->

#   context "errors", ->
#     it "bubbles 500's from external server"

#     it "throws on authentication required"
