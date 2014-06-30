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
    this.sandbox.server.respond()
    Ecl.info("msg from child");
    Ecl.find("body")
    expect("foo").to.eq("foo");
  });
});