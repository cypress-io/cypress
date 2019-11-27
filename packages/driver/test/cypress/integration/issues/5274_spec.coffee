_ = Cypress._
Promise = Cypress.Promise
RESPONSE_TIMEOUT = 22222

describe "issue 5274", ->
  beforeEach ->
    cy.stub(Cypress, "backend").callThrough()
    Cypress.config("responseTimeout", RESPONSE_TIMEOUT)
    Cypress.config("defaultCommandTimeout", RESPONSE_TIMEOUT)

    @logs = []

    cy.on "log:added", (attrs, log) =>
      if attrs.name is "request"
        @lastLog = log
        @logs.push(log)

    return null

  it "should request url with ’ character in pathname", (done) ->
    cy.request("http://localhost:1234/’")

    cy.on "fail", (err) ->
      expect(err.message).to.contain "cy.request() failed trying to load:"
      expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
      done()

  it "should request url with ’ escaped in pathname", (done) ->
    cy.request(encodeURI('http://localhost:1234/’'))

    cy.on "fail", (err) ->
      expect(err.message).to.contain "cy.request() failed trying to load:"
      expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"
      done()

  it "should visit url with Unicode in pathname from BMP to Astral Plane", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.contain "cy.request() failed trying to load:"
      expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"

    cy.request('http://localhost:1234/%')
    cy.request('http://localhost:1234/’')
    cy.request('http://localhost:1234/£')
    cy.request('http://localhost:1234/Ȥ')
    cy.request('http://localhost:1234/˵')
    cy.request('http://localhost:1234/֍')
    cy.request('http://localhost:1234/ץ')
    cy.request('http://localhost:1234/ص')
    cy.request('http://localhost:1234/ޥ')
    cy.request('http://localhost:1234/ࠊ')
    cy.request('http://localhost:1234/ࢨ')
    cy.request('http://localhost:1234/⍸')
    cy.request('http://localhost:1234/㇇')
    cy.request('http://localhost:1234/ヸ')
    cy.request('http://localhost:1234/ㇻ')
    cy.request('http://localhost:1234/𓌶')
    cy.request('http://localhost:1234/🜈')
    cy.request('http://localhost:1234/🠋')
    cy.request('http://localhost:1234/👩')
    cy.request('http://localhost:1234/😀')
    done()

  it "should request url with any Unicode escaped character in pathname", (done) ->
    cy.on "fail", (err) ->
      expect(err.message).to.contain "cy.request() failed trying to load:"
      expect(err.message).to.not.contain "ERR_UNESCAPED_CHARACTERS"

    cy.request(encodeURI('http://localhost:1234/%'))
    cy.request(encodeURI('http://localhost:1234/’'))
    cy.request(encodeURI('http://localhost:1234/£'))
    cy.request(encodeURI('http://localhost:1234/Ȥ'))
    cy.request(encodeURI('http://localhost:1234/˵'))
    cy.request(encodeURI('http://localhost:1234/֍'))
    cy.request(encodeURI('http://localhost:1234/ץ'))
    cy.request(encodeURI('http://localhost:1234/ص'))
    cy.request(encodeURI('http://localhost:1234/ޥ'))
    cy.request(encodeURI('http://localhost:1234/ࠊ'))
    cy.request(encodeURI('http://localhost:1234/ࢨ'))
    cy.request(encodeURI('http://localhost:1234/⍸'))
    cy.request(encodeURI('http://localhost:1234/㇇'))
    cy.request(encodeURI('http://localhost:1234/ヸ'))
    cy.request(encodeURI('http://localhost:1234/ㇻ'))
    cy.request(encodeURI('http://localhost:1234/𓌶'))
    cy.request(encodeURI('http://localhost:1234/🜈'))
    cy.request(encodeURI('http://localhost:1234/🠋'))
    cy.request(encodeURI('http://localhost:1234/👩'))
    cy.request(encodeURI('http://localhost:1234/😀'))
    done()
