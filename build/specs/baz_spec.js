describe("Baz Spec", function(){
  it("can baz [aad]", function(){
    console.warn("can baz");
    expect("baz").to.eq("baz");
  });

  it("can baz2 [aae]", function(){
    console.warn("can baz2");
    expect("baz2").to.eq("baz2");
  });

  it("can baz3 [aaf]", function(){
    console.warn("can baz3");
    expect("baz3").to.eq("baz3");
  });

  it("can baz4 [aag]", function(){
    console.warn("can baz4");
    Ecl.info("child msg from baz4")
    expect("baz4").to.eq("baz4");
  });
});