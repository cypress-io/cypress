{ _ } = window.testUtils

describe "$Cypress.LocalStorage API", ->
  before ->
    @clear = (remote) =>
      @localStorage.clear()
      @remoteStorage.clear()

    @setItem = (item, value) =>
      @localStorage.setItem item, value
      @remoteStorage.setItem item, value

    @removeItem = (item) =>
      @localStorage.removeItem item
      @remoteStorage.removeItem item

    @getItems = (item) =>
      [@localStorage.getItem(item), @remoteStorage.getItem(item)]

  beforeEach ->
    # @emit = @sandbox.spy(Eclectus.Command.prototype, "emit")

    loadFixture("generic").done (iframe) =>
      # Eclectus.patch {$remoteIframe: $(iframe)}
      @localStorage = window.localStorage
      @remoteStorage = iframe.contentWindow.localStorage

      $Cypress.LocalStorage.setStorages(@localStorage, @remoteStorage)
      # @remoteWindow = iframe.contentWindow

      # $Cypress.set(@currentTest) if @currentTest
      # $Cypress.setup(runner, @iframe, {}, ->)

      @clear()

  afterEach ->
    $Cypress.LocalStorage.unsetStorages()

  describe "basic local storage sanity check", ->
    it "shares local storage when setting items", ->
      @localStorage.setItem "foo", "bar"
      arr = [@localStorage.getItem("foo"), @remoteStorage.getItem("foo")]
      expect(arr).to.deep.eq ["bar", "bar"]

    it "removes local storage when deleting items", ->
      @localStorage.setItem "foo", "bar"
      @remoteStorage.setItem "foo", "bar"

      @localStorage.removeItem("foo")
      @remoteStorage.removeItem("foo")

      arr = [@localStorage.getItem("foo"), @remoteStorage.getItem("foo")]
      expect(arr).to.deep.eq [null, null]

    ## this fails in every single version of IE because it does not
    ## properly handle iframe's @localStorage.  it will "appear" to
    ## propogate properly to the parent, aka it will return the correct .length
    ## but when you iterate over the keys it is fubar'd
    it "returns the same number of keys when remoteWindow sets localStorage", ->
      count = _.keys(localStorage).length

      @remoteStorage.setItem "foo", "bar"

      keys = _.keys(localStorage).length

      expect(keys).to.eq count + 1

  it "#setStorages", ->
    $Cypress.LocalStorage.setStorages({}, {})

    _.each ["localStorage", "remoteStorage"], (store) ->
      expect($Cypress.LocalStorage[store]).to.deep.eq {}

  it "#unsetStorages", ->
    $Cypress.LocalStorage.setStorages({}, {})
    $Cypress.LocalStorage.unsetStorages()

    _.each ["localStorage", "remoteStorage"], (store) ->
      expect($Cypress.LocalStorage[store]).to.be.null

  describe "#clear", ->
    it "is defined", ->
      expect($Cypress.LocalStorage.clear).not.to.be.undefined

    it "nukes all LS objects with no args passed", ->
      @setItem "foo", "bar"
      $Cypress.LocalStorage.clear()

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

    it "can remove specific items by string", ->
      @setItem "foo", "bar"
      @setItem "baz", "quux"

      $Cypress.LocalStorage.clear("foo")

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("baz")
      expect(arr).to.deep.eq ["quux", "quux"]

    it "can remove specific items by regex", ->
      @setItem "foo", "bar"
      @setItem "food", "bars"
      @setItem "baz", "quux"

      $Cypress.LocalStorage.clear /foo/

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("food")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("baz")
      expect(arr).to.deep.eq ["quux", "quux"]

    it "references localStorage in remoteWindow", ->
      @remoteStorage.setItem "foo", "bar"

      $Cypress.LocalStorage.clear()

      foo = @remoteStorage.getItem "foo"

      expect(foo).to.eq null
