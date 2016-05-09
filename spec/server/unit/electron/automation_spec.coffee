require("../../spec_helper")

cookies    = require("#{root}../lib/electron/handlers/cookies")
automation = require("#{root}../lib/electron/handlers/automation")

describe "lib/electron/handlers/automation", ->
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
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
        ])

      it "returns all cookies", ->
        automation.perform("get:cookies", {domain: "localhost"})
        .then (resp) ->
          expect(resp).to.deep.eq([
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
          ])

    describe "get:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com", name: "session"})
        .resolves([
          {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123}
        ])
        .withArgs(@cookies, {domain: "google.com", name: "doesNotExist"})
        .resolves([])

      it "returns a specific cookie by name", ->
        automation.perform("get:cookie", {domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123})

      it "returns null when no cookie by name is found", ->
        automation.perform("get:cookie", {domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
          expect(resp).to.be.null

    describe "set:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "set")
        .withArgs(@cookies, {domain: "google.com", name: "session", value: "key"})
        .resolves(
          {name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false}
        )
        .withArgs(@cookies, {name: "foo", value: "bar"})
        .rejects(new Error("some error"))

      it "resolves with the cookie props", ->
        automation.perform("set:cookie", {domain: "google.com", name: "session", value: "key"})
        .then (resp) ->
          expect(resp).to.deep.eq({domain: "google.com", name: "session", value: "key"})

      it "rejects with error", ->
        automation.perform("set:cookie", {name: "foo", value: "bar"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe "clear:cookies", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com"})
        .resolves([
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
        ])
        .withArgs(@cookies, {domain: "cdn.github.com"})
        .resolves([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123}
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

      it "resolves with array of removed cookies", ->
        automation.perform("clear:cookies", {domain: "google.com"})
        .then (resp) ->
          expect(resp).to.deep.eq([
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
            {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
          ])

      it "rejects with error", ->
        automation.perform("clear:cookies", {domain: "cdn.github.com"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe "clear:cookie", ->
      beforeEach ->
        @sandbox.stub(cookies, "get")
        .withArgs(@cookies, {domain: "google.com", name: "session"})
        .resolves([
          {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
        ])
        .withArgs(@cookies, {domain: "google.com", name: "doesNotExist"})
        .resolves([])
        .withArgs(@cookies, {domain: "cdn.github.com", name: "shouldThrow"})
        .resolves([
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123}
        ])

        @sandbox.stub(cookies, "remove")
        .withArgs(@cookies, {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123})
        .resolves(
          {name: "session", url: "https://google.com/", storeId: "123"}
        )
        .withArgs(@cookies, {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123})
        .rejects(new Error("some error"))

      it "resolves single removed cookie", ->
        automation.perform("clear:cookie", {domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq(
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          )

      it "returns null when no cookie by name is found", ->
        automation.perform("clear:cookie", {domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
          expect(resp).to.be.null

      it "rejects with error", ->
        automation.perform("clear:cookie", {domain: "cdn.github.com", name: "shouldThrow"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")
