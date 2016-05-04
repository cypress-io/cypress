require("../../spec_helper")

cookies    = require("#{root}../lib/electron/handlers/cookies")
automation = require("#{root}../lib/electron/handlers/automation")

describe.only "lib/electron/handlers/automation", ->
  context "unit", ->

  context "integration", ->
    beforeEach ->
      @cookies = {}
      @sandbox.stub(automation.automation, "getSessionCookies").returns(@cookies)

    describe "get:cookies", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "localhost"})
        .resolves([
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456, c: "a", d: "c"}
        ])

      it "returns all cookies", (done) ->
        automation.perform 123, "get:cookies", {domain: "localhost"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj).to.deep.eq({
            response: [
              {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
              {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
            ]
          })
          done()

    describe "get:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com", name: "session"})
        .resolves([
          {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123}
        ])
        .withArgs(@cookies, {domain: "google.com", name: "doesNotExist"})
        .resolves([])

      it "returns a specific cookie by name", (done) ->
        automation.perform 123, "get:cookie", {domain: "google.com", name: "session"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123})
          done()

      it "returns null when no cookie by name is found", (done) ->
        automation.perform 123, "get:cookie", {domain: "google.com", name: "doesNotExist"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.be.null
          done()

    describe "set:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "set")
        .withArgs(@cookies, {domain: "google.com", name: "session", value: "key"})
        .resolves(
          {name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false, a: "a", b: "b"}
        )
        .withArgs(@cookies, {name: "foo", value: "bar"})
        .rejects(new Error("some error"))

      it "resolves with the cookie details", (done) ->
        automation.perform 123, "set:cookie", {domain: "google.com", name: "session", value: "key"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq({name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false})
          done()

      it "rejects with error", (done) ->
        automation.perform 123, "set:cookie", {name: "foo", value: "bar"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

    describe "clear:cookies", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com"})
        .resolves([
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
          {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456, c: "a", d: "c"}
        ])
        .withArgs(@cookies, {domain: "cdn.github.com"})
        .resolves([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])

        @sandbox.stub(cookies, "remove")
        .withArgs(@cookies, {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123})
        .resolves(
          {name: "session", url: "https://google.com/", storeId: "123"}
        )
        .withArgs(@cookies, {name: "foo", value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456})
        .resolves(
          {name: "foo", url: "https://google.com/foo", storeId: "123"}
        )
        .withArgs(@cookies, {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123})
        .rejects(new Error("some error"))

      it "resolves with array of removed cookies", (done) ->
        automation.perform 123, "clear:cookies", {domain: "google.com"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq([
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
            {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
          ])
          done()

      it "rejects with error", (done) ->
        automation.perform 123, "clear:cookies", {domain: "cdn.github.com"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()

    describe "clear:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com", name: "session"})
        .resolves([
          {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])
        .withArgs(@cookies, {domain: "google.com", name: "doesNotExist"})
        .resolves([])
        .withArgs(@cookies, {domain: "cdn.github.com", name: "shouldThrow"})
        .resolves([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123, a: "a", b: "c"}
        ])

        @sandbox.stub(cookies, "remove")
        .withArgs(@cookies, {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123})
        .resolves(
          {name: "session", url: "https://google.com/", storeId: "123"}
        )
        .withArgs(@cookies, {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123})
        .rejects(new Error("some error"))

      it "resolves single removed cookie", (done) ->
        automation.perform 123, "clear:cookie", {domain: "google.com", name: "session"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.deep.eq(
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          )
          done()

      it "returns null when no cookie by name is found", (done) ->
        automation.perform 123, "clear:cookie", {domain: "google.com", name: "doesNotExist"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.response).to.be.null
          done()

      it "rejects with error", (done) ->
        automation.perform 123, "clear:cookie", {domain: "cdn.github.com", name: "shouldThrow"}, (id, obj) ->
          expect(id).to.eq(123)
          expect(obj.__error).to.eq("some error")
          done()
