describe("Foo Spec", function(){
  console.warn("foo spec")
  it("can foo [aaa]", function(){
    // Ecl.server()
    this.sandbox.server()

    this.sandbox.server.mock({
      url: /foo/,
      response: {foo: "bar"}
    })

    $.ajax({
      url: "/foo",
      data: {baz: "quux"},
      success: function(){},
      dataType: "json",
    });

    console.warn("SERVER RESPONDING", this.sandbox)
    var _this = this;
    _.delay(function(){
      _this.sandbox.server.respond()
    }, 3000)
    Ecl.info("msg from child");
    Ecl.find("body")
    expect("foo").to.eq("foo");
  });
});