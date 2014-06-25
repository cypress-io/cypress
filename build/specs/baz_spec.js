describe("Baz Spec", function(){
  it("can baz [aae]", function(){
    console.warn("can baz2");
    expect("baz2").to.eq("baz2");
  });

  it("can baz2 [aaf]", function(){
    console.warn("can baz3");
    expect("baz3").to.eq("baz3");
  });

  it("can baz3 [aag]", function(){
    console.warn("can baz4");
    Ecl.info("child msg from baz4")
    expect("baz4").to.eq("baz4");
  });
});