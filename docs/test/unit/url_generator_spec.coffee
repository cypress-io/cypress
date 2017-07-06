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

  context ".getLocalFile", ->
    beforeEach ->
      @sandbox.stub(fs, "stat").returns(Promise.resolve())

    it "requests file", ->
      urlGenerator.getLocalFile(data, "as")
      .spread (pathToFile, str) ->
        expect(pathToFile).to.eq("api/commands/as.html")
        expect(str).to.be.a("string")

    it "throws when cannot find file", ->
      urlGenerator.getLocalFile(data, "foo")
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        expect(err.message).to.include("Could not find a valid doc file in the sidebar.yml for: foo")

  context ".validateAndGetUrl", ->
    it "fails when given undefined href", ->
      render = (str) ->
        return Promise.resolve("<html><div id='notes'>notes</div></html>")

      urlGenerator.validateAndGetUrl(data, undefined, 'foo', 'content', render )
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        [
          "A url tag was not passed an href argument."
          "The source file was: foo"
          "url tag's text was: content",
        ].forEach (msg) ->
          expect(err.message).to.include(msg)

    it "fails when external returns non 2xx", ->
      nock("https://www.google.com")
      .head("/")
      .reply(500)

      urlGenerator.validateAndGetUrl(data, "https://www.google.com")
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        expect(err.message).to.include("Request to: https://www.google.com/ failed. (Status Code 500)")

    it "fails when URL is invalid", ->
      urlGenerator.validateAndGetUrl(data, "https://hub.docker.com/[object Object]p>")
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        expect(err.message).to.include("You must quote the URL: https://hub.docker.com")

    it "verifies local file and caches subsequent requests", ->
      markdown = "## Notes\nfoobarbaz"

      render = (str) ->
        expect(str).to.eq(markdown)

        return Promise.resolve("<html><div id='notes'>notes</div></html>")

      @sandbox.stub(fs, "readFile").returns(Promise.resolve(markdown))

      urlGenerator.validateAndGetUrl(data, "and#notes", "", "", render)
      .then (pathToFile) ->
        expect(pathToFile).to.eq("/api/commands/and.html#notes")

        urlGenerator.validateAndGetUrl(data, "and#notes", "", "", render)
      .then (pathToFile) ->
        expect(pathToFile).to.eq("/api/commands/and.html#notes")

        expect(fs.readFile).to.be.calledOnce

    it "verifies external url with anchor href matching hash", ->
      nock("https://www.google.com")
      .get("/")
      .reply(200, "<html><a href='#assertions'>assertions</a></html>")

      urlGenerator.validateAndGetUrl(data, "https://www.google.com/#assertions")
      .then (url) ->
        expect(url).to.eq("https://www.google.com/#assertions")

        urlGenerator.validateAndGetUrl(data, "https://www.google.com/#assertions")
      .then (url) ->
        expect(url).to.eq("https://www.google.com/#assertions")

    it "fails when hash is not present in response", ->
      nock("https://www.google.com")
      .get("/")
      .reply(200, "<html></html>")

      urlGenerator.validateAndGetUrl(data, "https://www.google.com/#foo", "bar.md")
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        [
          "Constructing {% url %} tag helper failed"
          "The source file was: bar.md"
          "You referenced a hash that does not exist at: https://www.google.com/",
          "Expected to find an element matching the id: #foo or href: #foo"
          "The HTML response body was:"
          "<html></html>"
        ].forEach (msg) ->
          expect(err.message).to.include(msg)

    it "fails when hash is not present in local file", ->
      render = (str) ->
        return Promise.resolve("<html></html>")

      @sandbox.stub(fs, "readFile").returns(Promise.resolve(""))

      urlGenerator.validateAndGetUrl(data, "and#foo", "guides/core-concepts/bar.md", "content", render)
      .then ->
        throw new Error("should have caught error")
      .catch (err) ->
        [
          "Constructing {% url %} tag helper failed"
          "The source file was: guides/core-concepts/bar.md"
          "You referenced a hash that does not exist at: api/commands/and.html",
          "Expected to find an element matching the id: #foo or href: #foo"
          "The HTML response body was:"
          "<html></html>"
        ].forEach (msg) ->
          expect(err.message).to.include(msg)

    it "resolves cached values in a promise", ->
      urlGenerator.cache["foo"] = "bar"

      urlGenerator.validateAndGetUrl(data, "foo")
      .then (url) ->
        expect(url).to.eq("bar")
