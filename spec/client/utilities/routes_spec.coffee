describe "router methods [oa8]", ->
  context "dynamic creation of routes [18d]", ->
    it "allows for dynamic routes [rg8]", ->
      route = Routes.create("tests/:id", 12)
      expect(route).to.eq "/tests/12"

    it "works with an object as params [8qt]", ->
      route = Routes.create("tests/:test_id/specs/:id", test_id: 12, id: 6, ids: [1,2,3])
      expect(route).to.eq "/tests/12/specs/6?ids=|1|2|3"

    it "works with multiple arguments [6xf]", ->
      route = Routes.create("tests/:id", 1001, foo: true, bar: false)
      expect(route).to.eq "/tests/1001?foo=true&bar=false"

    it "works with splats [5e9]", ->
      route = Routes.create "foobars/:id/*tab", id: "123", tab: "edit/config"
      expect(route).to.eq "/foobars/123/edit/config"

    it "works with splats and query params [pim]", ->
      route = Routes.create "tests/*id", id: "router_spec.coffee", env: "web"
      expect(route).to.eq "/tests/router_spec.coffee?env=web"