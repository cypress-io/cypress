Ecl = new Eclectus

describe "Local Storage API", ->
  before ->
    @clear = (remote) =>
      localStorage.clear()
      @remoteWindow.localStorage.clear()

    @setItem = (item, value) =>
      localStorage.setItem item, value
      @remoteWindow.localStorage.setItem item, value

    @removeItem = (item) =>
      localStorage.removeItem item
      @remoteWindow.localStorage.removeItem item

    @getItems = (item) =>
      [localStorage.getItem(item), @remoteWindow.localStorage.getItem(item)]

  beforeEach ->
    @emit = @sandbox.spy(Eclectus.Command.prototype, "emit")

    loadFixture("html/generic").done (iframe) =>
      Eclectus.patch {$remoteIframe: $(iframe)}
      @remoteWindow = iframe.contentWindow

      @clear()

  describe "basic local storage sanity check", ->
    it "shares local storage when setting items", ->
      localStorage.setItem "foo", "bar"
      arr = [localStorage.getItem("foo"), @remoteWindow.localStorage.getItem("foo")]
      expect(arr).to.deep.eq ["bar", "bar"]

    it "removes local storage when deleting items", ->
      localStorage.setItem "foo", "bar"
      @remoteWindow.localStorage.setItem "foo", "bar"

      localStorage.removeItem("foo")
      @remoteWindow.localStorage.removeItem("foo")

      arr = [localStorage.getItem("foo"), @remoteWindow.localStorage.getItem("foo")]
      expect(arr).to.deep.eq [null, null]

    ## this fails in every single version of IE because it does not
    ## properly handle iframe's localStorage.  it will "appear" to
    ## propogate properly to the parent, aka it will return the correct .length
    ## but when you iterate over the keys it is fubar'd
    it "returns the same number of keys when remoteWindow sets localStorage", ->
      count = _(localStorage).keys().length

      @remoteWindow.localStorage.setItem "foo", "bar"

      keys = _(localStorage).keys().length

      expect(keys).to.eq count + 1

  describe "#clear", ->
    it "is defined", ->
      expect(Ecl.clear).not.to.be.undefined

    it "nukes all LS objects with no args passed", ->
      @setItem "foo", "bar"
      Ecl.clear()

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

    it "does not nuke ecl keys no matter what", ->
      @setItem "ecl-foo", "bar"
      @setItem "foo", "bar"

      Ecl.clear()

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("ecl-foo")
      expect(arr).to.deep.eq ["bar", "bar"]

    it "can remove specific items by string", ->
      @setItem "foo", "bar"
      @setItem "baz", "quux"

      Ecl.clear("foo")

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("baz")
      expect(arr).to.deep.eq ["quux", "quux"]

    it "can remove specific items by regex", ->
      @setItem "foo", "bar"
      @setItem "food", "bars"
      @setItem "baz", "quux"

      Ecl.clear /foo/

      arr = @getItems("foo")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("food")
      expect(arr).to.deep.eq [null, null]

      arr = @getItems("baz")
      expect(arr).to.deep.eq ["quux", "quux"]

    it "references localStorage in remoteWindow", ->
      @remoteWindow.localStorage.setItem "foo", "bar"

      Ecl.clear()

      foo = @remoteWindow.localStorage.getItem "foo"

      expect(foo).to.eq null

