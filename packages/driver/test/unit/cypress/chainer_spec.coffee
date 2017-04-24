describe "$Cypress.Chainer API", ->
  beforeEach ->
    @Cypress = $Cypress.create()
    # @cy      = $Cypress.Cy.create(@Cypress)

    # @chainer = $Cypress.Chainer.create(@Cypress)

  context ".inject", ->
    afterEach ->
      delete $Cypress.Chainer::foo

    it "sets key/fn on the $Chainer prototype", ->
      $Cypress.Chainer.inject "foo", ->
      expect($Cypress.Chainer.prototype.foo).to.be.a("function")

    it "calls the callback with cy context, id, and args", (done) ->
      cy = {prop: ->}

      fn = (id, args) ->
        expect(@).to.eq cy
        expect(id).to.eq chainer.id
        expect(args).to.deep.eq []
        done()

      $Cypress.Chainer.inject "foo", fn
      chainer = new $Cypress.Chainer cy
      chainer.foo()

  context ".create", ->

  context "#constructor", ->
    it "sets unique id", ->
      chainer = new $Cypress.Chainer
      expect(chainer.id).to.be.ok

    it "sets cy", ->
      cy = {}
      chainer = new $Cypress.Chainer cy
      expect(chainer.cy).to.eq cy