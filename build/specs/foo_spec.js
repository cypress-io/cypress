describe("Foo Spec", function(){
  console.warn("foo spec")
  it("can foo [aaa]", function(){
    console.warn("can foo");
    Ecl.info("msg from child");
    Ecl.find("body")
    expect("foo").to.eq("foo");
  });
});