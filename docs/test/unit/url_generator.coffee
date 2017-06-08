require("../spec_helper")

fs = require("hexo-fs")
path = require("path")
Promise = require("bluebird")
urlGenerator = require("../../lib/url_generator")

data = {
  guides: {
    'getting-started': {
      'why-cypress': 'why-cypress.html',
      'next-steps': 'next-steps.html'
    },
    'cypress-basics': {
      'overview': 'overview.html',
      'core-concepts': 'core-concepts.html',
      'known-issues': 'known-issues.html'
    },
  }
  api: {
    welcome: {
      api: 'api.html'
    },
    commands: {
      and: 'and.html',
      as: 'as.html',
    },
  }
}

describe "lib/url_generator", ->
  context ".normalizeNestedPaths", ->
    it "flattens object and returns each keypath to the value", ->
      expect(urlGenerator.normalizeNestedPaths(data).flattened).to.deep.eq({
        "why-cypress": "guides/getting-started/why-cypress.html"
        "next-steps": "guides/getting-started/next-steps.html"
        "overview": "guides/cypress-basics/overview.html"
        "core-concepts": "guides/cypress-basics/core-concepts.html"
        "known-issues": "guides/cypress-basics/known-issues.html"
        "api": "api/welcome/api.html"
        "and": "api/commands/and.html"
        "as": "api/commands/as.html"
      })

    it "expands object keypaths on the values", ->
      expect(urlGenerator.normalizeNestedPaths(data).expanded).to.deep.eq({
        guides: {
          'getting-started': {
            'why-cypress': 'guides/getting-started/why-cypress.html',
            'next-steps': 'guides/getting-started/next-steps.html'
          },
          'cypress-basics': {
            'overview': 'guides/cypress-basics/overview.html',
            'core-concepts': 'guides/cypress-basics/core-concepts.html',
            'known-issues': 'guides/cypress-basics/known-issues.html'
          },
        }
        api: {
          welcome: {
            api: 'api/welcome/api.html'
          },
          commands: {
            and: 'api/commands/and.html',
            as: 'api/commands/as.html',
          },
        }
      })

  context ".findFileBySource", ->
    it "finds by key", ->
      expect(urlGenerator.findFileBySource(data, "core-concepts")).to.eq(
        "guides/cypress-basics/core-concepts.html"
      )

    it "finds by property", ->
      expect(urlGenerator.findFileBySource(data, "guides/cypress-basics/overview")).to.eq(
        "guides/cypress-basics/overview.html"
      )

  context ".findUrlByFile", ->
    beforeEach ->
      @sandbox.stub(fs, "stat").returns(Promise.resolve())

    it "stats file", ->
      urlGenerator.findUrlByFile(data, "as")
      .then (pathToFile) ->
        expect(fs.stat).to.be.calledWith(path.resolve("source/api/commands/as.md"))
        expect(pathToFile).to.eq("/api/commands/as.html")

    it "throws when cannot find file", ->
      fn = ->
        urlGenerator.findUrlByFile(data, "foo")

      expect(fn).to.throw("Could not find a valid doc file in the sidebar.yml for: foo")

  context ".validateAndGetUrl", ->
    it "verifies external url", ->
      nock("https://www.google.com")
      .get("/")
      .reply(200)

      urlGenerator.validateAndGetUrl(data, "https://www.google.com")
      .then (url) ->
        expect(url).to.eq("https://www.google.com")

    it "fails when external returns non 2xx", ->
      nock("https://www.google.com")
      .get("/")
      .reply(500)

      urlGenerator.validateAndGetUrl(data, "https://www.google.com")
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        expect(err.message).to.include("Request to: https://www.google.com failed. (Status Code 500)")

    it "returns absolute path to file", ->
      urlGenerator.validateAndGetUrl(data, "and#notes")
      .then (pathToFile) ->
        expect(pathToFile).to.eq("/api/commands/and.html#notes")
