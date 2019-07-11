## THESE TESTS ARE COMMENTED OUT BECAUSE ALL OF REMOTE_INITIAL
## WAS REFACTORED AND MOST DO NOT APPLY.
## WILL ADD UNIT TESTS AS PROBLEMS ARISE (IF THEY ARISE)

require("../spec_helper")

through   = require("through")
Readable  = require("stream").Readable
proxy     = require("#{root}lib/controllers/proxy")

describe "lib/proxy", ->

#   it "injects content", (done) ->
#     readable = new Readable

#     readable.push('<head></head><body></body>')
#     readable.push(null)

#     readable.pipe(proxy.injectContent("wow"))
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
#         proxy.handle(@req, @res)

#     it "redirects on 301", (done) ->
#       nock(@redirectUrl)
#       .get("/")
#       .reply(200, =>
#         done()
#       )

#       proxy.handle(@req, @res)

#     it "resets session remote after a redirect", (done) ->
#       nock(@redirectUrl)
#       .get("/")
#       .reply(200, =>
#         expect(@req.session.remote).to.eql("http://x.com")
#         done()
#       )

#       proxy.handle(@req, @res)

#   context "#parseReqUrl", ->
#     it "removes /__remote/", ->
#       url = proxy.parseReqUrl("/__remote/www.github.com")
#       expect(url).to.eq "www.github.com"

#     it "removes __initial query param", ->
#       url = proxy.parseReqUrl("/__remote/www.github.com?__initial=true")
#       expect(url).to.eq "www.github.com"

#     it "leaves other query params", ->
#       url = proxy.parseReqUrl("/__remote/www.github.com?__initial=true&foo=bar")
#       expect(url).to.eq "www.github.com/?foo=bar"

#     it "doesnt strip trailing slashes", ->
#       url = proxy.parseReqUrl("/__remote/www.github.com/")
#       expect(url).to.eq "www.github.com/"

#   context "#prepareUrlForRedirect", ->
#     it "prepends with /__remote/ and adds __initial=true query param", ->
#       url = proxy.prepareUrlForRedirect("www.github.com", "www.github.com/bar")
#       expect(url).to.eq "/__remote/www.github.com/bar?__initial=true"

#     it "doesnt strip leading slashes", ->
#       url = proxy.prepareUrlForRedirect("www.github.com", "www.github.com/")
#       expect(url).to.eq "/__remote/www.github.com/?__initial=true"

#     it "handles url leading slashes", ->
#       url = proxy.prepareUrlForRedirect("www.github.com/foo", "www.github.com/foo/")
#       expect(url).to.eq "/__remote/www.github.com/foo/?__initial=true"

#     it "handles existing query params", ->
#       url = proxy.prepareUrlForRedirect("www.github.com", "www.github.com/foo?bar=baz")
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

#       proxy.handle(@req, @res)

#       expect(@req.session.remote).to.eql(@baseUrl)

#     it "does not include query params in the url", ->
#       @req =
#         url: "/__remote/#{@baseUrl}?foo=bar"
#         session: {}

#       proxy.handle(@req, @res)
#       expect(@req.session.remote).to.eql(@baseUrl)

#   context "relative files", ->
#     it "#getRelativeFileContent strips trailing slashes", ->
#       createReadStream = sinon.stub(fs, "createReadStream")
#       proxy.getRelativeFileContent("index.html/", {})
#       expect(createReadStream).to.be.calledWith("/Users/brian/app/index.html")

#   context "absolute files", ->

#   context "file files", ->

#   context "errors", ->
#     it "bubbles 500's from external server"

#     it "throws on authentication required"
