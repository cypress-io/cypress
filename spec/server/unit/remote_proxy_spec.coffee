## THESE TESTS ARE COMMENTED OUT BECAUSE ALL OF REMOTE_PROXY
## WAS REFACTORED AND MOST DO NOT APPLY.
## WILL ADD UNIT TESTS AS PROBLEMS ARISE (IF THEY ARISE)

# root        = "../../../"
# Server      = require("#{root}lib/server")
# RemoteProxy = require("#{root}lib/controllers/remote_proxy")
# through2    = require("through2")
# expect      = require('chai').expect
# sinon       = require('sinon')
# _           = require('lodash')
# supertest   = require('supertest')
# Promise     = require("bluebird")
# nock        = require('nock')

# baseUrl     = "http://www.x.com"

# describe "RemoteProxy", ->
#   beforeEach ->
#     @sandbox = sinon.sandbox.create()
#     @sandbox.stub(Server.prototype, "getCypressJson").returns({})

#     @server = Server("/Users/brian/app")
#     @app    = @server.app
#     @server.setCypressJson {
#       projectRoot: "/Users/brian/app"
#       baseUrl: "http://localhost:8000"
#     }

#     @remoteProxy  = RemoteProxy(@app)

#   afterEach ->
#     @sandbox.restore()
#     nock.cleanAll()
#     nock.enableNetConnect()

#   describe "interface", ->
#     it "returns a new instance", ->
#       expect(@remoteProxy).to.be.instanceOf(RemoteProxy)

#     it "throws without a session.remote", ->
#       fn = => @remoteProxy.handle({
#         session: {}
#       })

#       expect(fn).to.throw

#   describe "unit", ->
#     beforeEach ->
#       nock.disableNetConnect()

#       @res = through2.obj((cnk, enc, cb) -> cb(null, cnk))
#       @res = _.extend(@res,
#         statusCode: 200
#         contentType: ->
#         redirect: ->
#         setHeader: ->
#         writeHead: ->
#       )

#       @req = through2.obj (d, enc, cb) -> cb(null, d)

#       @req = _.extend(@req, {
#         session:
#           remote: baseUrl
#         headers: {}
#       })

#     describe "#pipeRelativeContent", ->
#       beforeEach ->
#         @relative = (requestUrl, externalUrl) =>
#           new Promise (resolve, reject) =>
#             nock(baseUrl)
#             .get(externalUrl)
#             .reply(200)

#             @req = _.extend(@req, {
#               url: requestUrl
#               method: "GET"
#             })

#             @remoteProxy.handle(
#               @req
#               @res
#               (e) -> throw e
#             )

#             @res.on 'end', (e) ->
#               if e
#                 reject(e)
#               else
#                 resolve()

#             @req.end()

#       it "GETs /bob.css ==> #{baseUrl}/bob.css ", ->
#         @relative("/bob.css", "/bob.css")

#       it "GETS /__remote/http:/bob ==> #{baseUrl}/bob", ->
#         @relative("/__remote/http:/bob", "/bob")

#       it "GETS /__remote/bob ==> #{baseUrl}/bob", ->
#         @relative("/__remote/bob", "/bob")

#       # it "GETS /__remote/http:/localhost:8000/app/bower_components/bootstrap.css.map", ->
#         # @relative "/__remote/http:/localhost:8000/app/bower_components/bootstrap.css.map", "/app/bower_components/bootstrap.css.map"

#     context "#pipeAbsoluteContent", ->
#       beforeEach ->
#         @absolute = (requestUrl, baseUrl, externalUrl) =>
#           @req.session.remote = baseUrl

#           new Promise (resolve, reject) =>
#             nock(baseUrl)
#             .get(externalUrl)
#             .reply(200)

#             @req = _.extend(@req, {
#               url: requestUrl
#               method: "GET"
#             })

#             @remoteProxy.handle(
#               @req
#               @res
#               (e) -> throw e
#             )

#             @res.on 'end', (e) ->
#               if e
#                 reject(e)
#               else
#                 resolve()

#             @req.end()

#       it "GETS /__remote/http://bootstrap.com/bob.css ==> http://bootstrap.com/bob.css", ->
#         @absolute("/__remote/http://bootstrap.com/bob.css", "http://bootstrap.com", "/bob.css")

#       it "GETS /__remote/http://foo.com/a.js?d=1 ==> http://foo.com/a.js?d=1", ->
#         @absolute "/__remote/http://foo.com/a.js?d=1", "http://foo.com", "/a.js?d=1"

#       it "GETS /__remote/http://localhost:8000/app/js/services.js ==> http://localhost:8000/app/js/services.js", ->
#         @absolute "/__remote/http://localhost:8000/app/js/services.js", "http://localhost:8000", "/app/js/services.js"

#       it "GETs /__remote/http://bob/tom/george.html ==> http://bob/tom/george.html", ->
#         @absolute "/__remote/http://bob/tom/george.html", "http://bob", "/tom/george.html"

#     context "#getRequestUrl", ->
#       it "inserts two forward slashes for bad http protocols", ->
#         url = @remoteProxy.getRequestUrl("/__remote/http:/localhost:8000/app.css.map", "http://localhost:8000")
#         expect(url).to.eq "http://localhost:8000/app.css.map"

#       it "works with https prototcols", ->
#         url = @remoteProxy.getRequestUrl("/__remote/https:/localhost:8000/app.css.map", "https://localhost:8000")
#         expect(url).to.eq "https://localhost:8000/app.css.map"

#       describe "bad http normalization from relative paths", ->
#         beforeEach ->
#           @relative = (source, destination) =>
#             if source.includes("https")
#               remoteHost = "https://getbootstrap.com"
#             else
#               remoteHost = "http://getbootstrap.com"
#             url = @remoteProxy.getRequestUrl "/__remote/#{source}", remoteHost
#             expect(url).to.eq destination

#         it "http://dist/css/bootstrap", ->
#           @relative "http://dist/css/bootstrap", "http://getbootstrap.com/dist/css/bootstrap"

#         it "http:/dist/css/bootstrap", ->
#           @relative "http:/dist/css/bootstrap", "http://getbootstrap.com/dist/css/bootstrap"

#         it "https://dist/css/bootstrap", ->
#           @relative "https://dist/css/bootstrap", "https://getbootstrap.com/dist/css/bootstrap"

#         it "https:/dist/css/bootstrap", ->
#           @relative "https:/dist/css/bootstrap", "https://getbootstrap.com/dist/css/bootstrap"

#         it "dist/css/bootstrap", ->
#           @relative "dist/css/bootstrap", "dist/css/bootstrap"

#   context "integration", ->
#     beforeEach ->
#       @server.configureApplication()

#     it "GETS /__remote/http://localhost:8000/app/vendor.js", (done) ->
#       nock("http://localhost:8000")
#       .get("/app/vendor.js")
#       .reply(200)

#       supertest(@app)
#       .get("/__remote/http://localhost:8000/app/vendor.js")
#       .expect(200)
#       .end(done)

#   # context "#pipeUrlContent (relative requests from root)", ->
#   #   it "works with a single level up", (done) ->

#   #   it "works with nested paths", (done) ->
#   #     nock(baseUrl)
#   #     .get("/bob/tom/george.css")
#   #     .reply(200)

#   #     @req = _.extend(@req, {
#   #       url: "/__remote/http://bob/tom/george.css"
#   #       method: "GET"
#   #     })

#   #     @remoteProxy.handle(
#   #       @req
#   #       @res
#   #       (e) -> throw e
#   #     )

#   #     @res.on 'end', (e) -> done()
#   #     @req.end()

#   # it "Basic Auth"

#   # context "VERBS", ->
#   #   beforeEach ->

#   #   context "POST", ->
#   #     it "handle with url params", (done) ->
#   #       nock(baseUrl)
#   #       .post("/?foo=1&bar=2")
#   #       .reply(200)

#   #       @req = _.extend(@req, {
#   #         url: "/__remote/#{baseUrl}?foo=1&bar=2",
#   #         method: 'POST'
#   #       })

#   #       @remoteProxy.handle(@req, @res, (e) -> done(e))

#   #       @res.on 'end', -> done()

#   #       @req.end()

#   #     it "handle body content"

#   #   it "GET"
#   #   it "PUT"
#   #   it "DELETE"
#   #   it "OPTIONS"
#   #   it "PATCH"

#   # context "websockets", ->

#   # context "https", ->

#   # context "headers", ->
#   #   it "passes headers", (done) ->
#   #     nock(baseUrl, {
#   #       reqheaders: {
#   #         'head': 'goat'
#   #       }
#   #     })
#   #     .get("/")
#   #     .reply(200)

#   #     @req = _.extend(@req, {
#   #       url: "/__remote/#{baseUrl}/",
#   #       method: 'GET',
#   #       headers:
#   #         'head': 'goat'
#   #     })

#   #     @remoteProxy.handle(@req, @res, (e) -> done(e))
#   #     @res.on 'end', -> done()

#   #     @req.end()
