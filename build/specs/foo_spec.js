describe("Foo Spec", function(){
  console.warn("foo spec")
  it("can foo [aaa]", function(){
    // Ecl.server()
    this.sandbox.server()
    this.sandbox.server.mock({
      url: /foo/,
      response: {}
    })
    $.getJSON("/foo.json")
    console.warn("can foo", this, this.sandbox);
    Ecl.info("msg from child");
    Ecl.find("body")
    expect("foo").to.eq("foo");
  });
});